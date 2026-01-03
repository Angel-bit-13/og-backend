const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(cors());

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const bookRoutes = require("./routes/bookRoutes");
app.use("/api/books", bookRoutes);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

app.use("/api/admin", require("./routes/adminRoutes"));

const rentalRoutes = require("./routes/rentalRoutes");
app.use("/api/rentals", rentalRoutes);



// test route
app.get("/", (req, res) => {
  res.send("Backend running");
});

// connect to db
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.log("MongoDB Error:", err));

// start server
app.listen(process.env.PORT, () => {
  console.log("Server running on port " + process.env.PORT);
});