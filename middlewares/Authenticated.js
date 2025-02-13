const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isAuthenticated = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    try {
        const decoded = jwt.decode(token, { complete: true });

        if (!decoded || !decoded.header || !decoded.header.kid) {
            throw new Error("Invalid token format");
        }

        if (decoded.header.alg === "RS256") {
            // 🔹 Google Sign-In Verification
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            req.user = ticket.getPayload(); // Extract user data
        } else {
            // 🔹 Normal JWT Login
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        }

        console.log("✅ Authenticated User:", req.user);
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

module.exports = { isAuthenticated };
