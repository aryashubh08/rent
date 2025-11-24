const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.js");

const {
  registerUser,
  loginUser,
  getUserData,
  getCars,
} = require("../controller/userController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/data", protect, getUserData);
router.get("/cars", getCars);

module.exports = router;
