const ImageKit = require("../config/imageKit.js");
const User = require("../model/User");
const Car = require("../model/Car");
const fs = require("fs");
const Booking = require("../model/Booking.js");

// Change user role to owner
exports.changeRoleToOwner = async (req, res) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { role: "owner" });

    return res.status(200).json({
      success: true,
      message: "Now you can list cars",
    });
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// API to create a new Car
exports.addCar = async (req, res) => {
  try {
    const { _id } = req.user;

    if (!req.body.carData) {
      return res.status(400).json({
        success: false,
        message: "Car data missing",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    let car = JSON.parse(req.body.carData);
    const imageFile = req.file;
    console.log(imageFile);

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    // Read image from temp disk
    const fileBuffer = fs.readFileSync(imageFile.path);

    // Upload file to ImageKit
    const response = await ImageKit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/cars",
    });

    const optimizedImageUrl = ImageKit.url({
      src: response.url, // IMPORTANT
      transformation: [
        {
          width: "1280",
          quality: "auto",
          format: "webp",
        },
      ],
    });

    // Create new Car entry
    const newCar = await Car.create({
      ...car,
      owner: _id,
      image: optimizedImageUrl,
    });
    // Delete temporary file
    fs.unlinkSync(imageFile.path);
    console.log(newCar);
    res.status(201).json({
      success: true,
      message: "Car added successfully",
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//api to list owner cars
exports.getOwnerCars = async (req, res) => {
  try {
    const { _id } = req.user;
    const cars = await Car.find({ owner: _id });
    return res.status(200).json({
      success: true,
      cars,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//api to toggle car availability
exports.toggleCarAvailability = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    //checking is car belong to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }
    car.isAvailable = !car.isAvailable;
    await car.save();

    return res.status(200).json({
      success: true,
      message: "Availability Toggled",
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//api to delete car
exports.deleteCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId);

    //checking is car belong to the user
    if (car.owner.toString() !== _id.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    car.owner = null;
    car.isAvailable = false;
    await car.save();

    return res.status(200).json({
      success: true,
      message: "Car Removed.",
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//api to get Dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;

    if (role !== "owner") {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cars = await Car.find({ owner: _id });

    // FIXED SORTING HERE
    const bookings = await Booking.find({ owner: _id })
      .populate("car")
      .sort({ createdAt: -1 });

    const pendingBookings = await Booking.find({
      owner: _id,
      status: "pending",
    });

    const completedBookings = await Booking.find({
      owner: _id,
      status: "confirmed",
    });

    const monthlyRevenue = bookings
      .filter((booking) => booking.status === "confirmed")
      .reduce((acc, booking) => acc + booking.price, 0);

    const dashboardData = {
      totalCars: cars.length,
      totalBookings: bookings.length,
      pendingBookings: pendingBookings.length,
      completedBookings: completedBookings.length,
      recentBookings: bookings.slice(0, 3),
      monthlyRevenue,
    };

    return res.status(200).json({
      success: true,
      dashboardData,
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//API to update user image
exports.updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    // Read image from temp disk
    const fileBuffer = fs.readFileSync(imageFile.path);

    // Upload file to ImageKit
    const response = await ImageKit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/users",
    });

    const optimizedImageUrl = ImageKit.url({
      src: response.url, // IMPORTANT
      transformation: [
        {
          width: "400",
          quality: "auto",
          format: "webp",
        },
      ],
    });
    const image = optimizedImageUrl;
    await User.findByIdAndUpdate(_id, { image });
    res.json({
      success: true,
      message: "Image updated successfully",
    });

    // Delete temporary file
    fs.unlinkSync(imageFile.path);
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
