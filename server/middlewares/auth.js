const jwt = require("jsonwebtoken");
const User = require("../model/User");
require("dotenv").config();

exports.protect = async (req, res, next) => {
  try {
    let authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];

    // Correct way → verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded = { id: 'userid', iat, exp }
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};
