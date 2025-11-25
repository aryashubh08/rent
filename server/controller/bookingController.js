const Booking = require("../model/Booking");
const Car = require("../model/Car");

// function to check availability of car for a given date
const checkAvailability = async (car, pickupDate, returnDate) => {
  const bookings = await Booking.find({
    car,
    pickupDate: { $lte: returnDate },
    returnDate: { $gte: pickupDate },
  });
  return bookings.length === 0;
};

//API to check Availability of cars for the given date and location
exports.checkAvailabilityOfCar = async (req, res) => {
  try {
    const { location, pickupDate, returnDate } = req.body;
    //fetch all available cars for given location
    const cars = await Car.find({ location, isAvailable: true });

    //check car availability for the given date range using promise
    const availableCarPromises = cars.map(async (car) => {
      const available = await checkAvailability(
        car._id,
        pickupDate,
        returnDate
      );
      return { ...car._doc, isAvailable: available };
    });
    let availableCars = await Promise.all(availableCarPromises);
    availableCars = availableCars.filter((car) => car.isAvailable === true);
    return res.status(200).json({
      success: true,
      availableCars,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//API to create Booking
exports.createBooking = async (req, res) => {
  try {
    const { _id } = req.user;
    const { car, pickupDate, returnDate } = req.body;
    const isAvailable = await checkAvailability(car, pickupDate, returnDate);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Car is not available for the selected dates",
      });
    }

    const carData = await Car.findById(car);

    //calculate price based on pickupDate and returnDate
    const picked = new Date(pickupDate);
    const returned = new Date(returnDate);
    const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24));
    const price = carData.pricePerDay * noOfDays;
    await Booking.create({
      car,
      owner: carData.owner,
      user: _id,
      pickupDate,
      returnDate,
      price,
    });
    return res.status(200).json({
      success: true,
      message: "Booking Created",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API to list User Bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("car")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      booking: bookings, // ✔ this matches frontend
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//API to get owners bookings
exports.getOwnerBookings = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const bookings = await Booking.find({ owner: req.user._id })
      .populate("car user")
      .select("-user.password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//api to change the booking status
exports.changeBookingStatus = async (req, res) => {
  try {
    const { _id } = req.user;
    const { bookingId, status } = req.body;
    const booking = await Booking.findById(bookingId);
    if (booking.owner.toString() !== _id.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }
    booking.status = status;
    await booking.save();
    res.json({
      success: true,
      message: "Status Updated",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
