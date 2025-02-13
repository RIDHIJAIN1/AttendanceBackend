const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Google OAuth Flow - Step 1: Redirect to Google's OAuth 2.0 server
const googleAuth = async (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid+profile+email&response_type=code`;
    console.log(url);
    res.redirect(url);
};

// Google OAuth Callback - Step 2: Handle Google authentication response
const googleAuthCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ success: false, message: "Authorization code missing" });
    }

    try {
        // Exchange authorization code for access and ID tokens
        const { data } = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: "http://localhost:3000/auth/google/callback",
            grant_type: 'authorization_code',
        });

        if (!data.access_token) {
            throw new Error("Failed to get access token");
        }
    
        const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });

        if (!profile.email) {
            throw new Error("Google did not return an email address");
        }

        let user = await User.findOne({ email: profile.email });

        if (!user) {
            user = new User({
                name: profile.name,
                email: profile.email,
                googleId: profile.id,
            });
            await user.save();
        }

        // Generate JWT for session management
        const authToken = jwt.sign(
            { userId: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Redirect to frontend with the token
        res.redirect(`http://localhost:5173?token=${authToken}`);
    } catch (error) {
        console.error('Google Auth Error:', error.response?.data || error);
        res.status(500).json({ success: false, message: "Failed to authenticate with Google" });
    }
};

// Manual Signup
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        let existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Manual Login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Export functions
module.exports = { signup, login, googleAuth, googleAuthCallback };
