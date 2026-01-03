const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const Book = require("../models/Book");
const User = require("../models/User");


/* =======================
   DASHBOARD STATS
======================= */
router.get("/stats", auth, admin, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const rentedBooks = await Book.countDocuments({ status: "rented" });
    const totalUsers = await User.countDocuments({ role: "user" });

    res.json({
      totalBooks,
      rentedBooks,
      availableBooks: totalBooks - rentedBooks,
      totalUsers,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET ALL BOOKS (ADMIN)
======================= */
router.get("/books", auth, admin, async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: "Error fetching books" });
  }
});

/* =======================
   ADD BOOK (ADMIN)
======================= */
router.post("/books", auth, admin, async (req, res) => {
  try {
    const { title, author, genre, publicationYear, coverImage } = req.body;
    const isbn = "ISBN-" + Date.now();
    if (!title || !author || !publicationYear || !coverImage || !genre) {
      return res.status(400).json({ message: "All required fields missing" });
    }

    const book = new Book({
      title,
      author,
      genre,
      publicationYear,
      isbn: "ISBN-" + Date.now(),
      coverImage,
      status: "available",
    });

    await book.save();
    res.status(201).json(book);
  } catch (err) {
  res.status(500).json({ message: err.message });
  }
});


/* =======================
   DELETE BOOK (ADMIN)
======================= */
router.delete("/books/:id", auth, admin, async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting book" });
  }
});

/* =======================
   UPDATE BOOK STATUS
======================= */
router.put("/books/:id", auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Error updating book" });
  }
});

module.exports = router;





















