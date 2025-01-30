// isAuthenticated.js (middleware)
const jwt = require('jsonwebtoken');

const admin = require('../config/firebase')
 const { User } = require('../models');


const isAuthenticated = async (req, res, next) => {
  
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }
   

    try {
       // Verify the token using Firebase Admin SDK
      const decodedVerified = await admin.auth().verifyIdToken(token);
      req.user = {
        firebaseId: decodedVerified.uid,
        email: decodedVerified.email,
        name: decodedVerified.name,
      };
      next();
     
    } catch (error) {
      console.error("JWT verification failed:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  }


module.exports = { isAuthenticated };