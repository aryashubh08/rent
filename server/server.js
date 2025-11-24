const express = require("express");
const cors = require("cors");
const userRouter = require("./routes/userRoutes");
const ownerRouter = require("./routes/ownerRoutes");
const bookingRouter = require("./routes/bookingRoutes");

const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 4000;

//db connection
const db = require("./config/connection");
db.connect();

//middlewares
app.use(
  cors({
    origin: "https://rent-lyart.vercel.app",
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/owner", ownerRouter);
app.use("/api/v1/bookings", bookingRouter);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
