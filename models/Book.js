const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    publicationYear: {
      type: Number,
      required: true,
    },

    genre: {
      type: String,
      required: true,
    },

    // AUTO-GENERATED ISBN
    isbn: {
      type: String,
      unique: true,
    },

    status: {
      type: String,
      enum: ["available", "rented"],
      default: "available",
    },

    rentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    coverImage: {
      type: String,
      required: true,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        value: Number,
      },
    ],
    averageRating: { type: Number, default: 0 },
    
    comments: [
      {
        text: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        createdAt: Date,
      },
    ],

  },
  { timestamps: true }
);

module.exports = mongoose.model("Book", bookSchema);
