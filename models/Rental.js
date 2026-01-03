const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "returned", "expired"],
    default: "active",
  },
  rentedAt: {
    type: Date,
    default: Date.now,
  },
  returnedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Rental", rentalSchema);
