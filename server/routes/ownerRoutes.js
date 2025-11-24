const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.js");
const upload = require("../middlewares/multer.js");
const {
  changeRoleToOwner,
  addCar,
  getOwnerCars,
  toggleCarAvailability,
  deleteCar,
  getDashboardData,
  updateUserImage,
} = require("../controller/ownerController");

router.post("/change-role", protect, changeRoleToOwner);
router.post("/add-car", upload.single("image"), protect, addCar);
router.get("/cars", protect, getOwnerCars);
router.post("/toggle-car", protect, toggleCarAvailability);
router.post("/delete-car", protect, deleteCar);
router.get("/dashboard", protect, getDashboardData);
router.post("/update-image", upload.single("image"), protect, updateUserImage);

module.exports = router;
