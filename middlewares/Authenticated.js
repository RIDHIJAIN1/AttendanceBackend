// isAuthenticated.js (middleware)
const jwt = require("jsonwebtoken");
const User = require("../models/User");

 const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("token" , token)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }
    

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded" , decoded)

    req.user = await User.findById(decoded.id);

console.log("decoded " , req.user)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

};

module.exports = {isAuthenticated}