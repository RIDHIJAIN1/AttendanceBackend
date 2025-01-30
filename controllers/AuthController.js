// const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const { sendSuccess, sendError } = require('../utils/response');
const User = require('../models/User');
// const admin = require('../config/firebase')
const admin = require('../config/firebase');
const serviceAccount = require('../serviceAcoountKey.json')
const OAUTH_SECRET = process.env.OAUTH_SECRET;



const signup = async (req, res) => {
  const { name, email, firebaseId } = req.body;

  if (!name || !email || !firebaseId) {
      return res.status(400).json({
          success: false,
          message: "Name, email, and firebaseId are required"
      });
  }

  try {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(firebaseId);
      console.log(decodedToken);
      const firebaseUid = decodedToken.uid;

      console.log(firebaseUid);
      // Ensure the provided email matches the one in the Firebase token
      if (decodedToken.email !== email) {
          return res.status(400).json({
              success: false,
              message: "Email does not match Firebase ID token"
          });
      }

      // Check if user already exists
      let userByEmail = await User.findOne({ email });
      let userByFirebaseId = await User.findOne({ firebaseId: firebaseUid });

      if (userByEmail) {
          return res.status(409).json({
              success: false,
              message: "User already exists with this email"
          });
      }

      if (userByFirebaseId) {
          return res.status(409).json({
              success: false,
              message: "User already exists with this firebaseId"
          });
      }

      // Create new user object
      const newUser = new User({
          name,
          email,
          firebaseId: firebaseUid,
      });

      // Save user to the database
      const registerUser = await newUser.save();

      // Send success response
      return res.status(201).json({
          success: true,
          message: 'User registered successfully',
          user: {
              name: registerUser.name,
              email: registerUser.email,
              firebaseId: registerUser.firebaseId,
          },
      });
  } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
          success: false,
          message: "Internal server error. Please try again later.",
      });
  }
};

const login = async(req,res)=>{
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      success: false,
      message: "Firebase ID token is required",
    });
  }

    try {
      // Sign in with Firebase
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { uid, email, name } = decodedToken;

    // Check if the user exists in MongoDB
    let user = await User.findOne({ firebaseId: uid });


      if (!user) {
          return res.status(404).json({
              success: false,
              message: "User not found"
          });
      }

      res.status(200).json({
        success: true,
        user,
        message: `Welcome back User`
    });
} catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
        success: false,
        message: "Invalid email or password"
    });
}
}
module.exports = { signup, login };
