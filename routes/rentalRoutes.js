const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const Rental = require("../models/Rental");
const Book = require("../models/Book");

/* =========================
   GET ALL RENTALS (ADMIN)
========================= */
router.get("/", auth, admin, async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate("user", "name email")
      .populate("book", "title author");

    res.json(rentals);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch rentals" });
  }
});

/* =========================
   CREATE RENTAL (USER)
========================= */
router.post("/", auth, async (req, res) => {
  try {
    const { bookId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.status === "rented") {
      return res.status(400).json({ message: "Book already rented" });
    }

    const rental = new Rental({
      user: req.user.id,
      book: bookId,
      rentedAt: new Date(),
      status: "active",
    });

    await rental.save();

    book.status = "rented";
    await book.save();

    res.status(201).json(rental);
  } catch (error) {
    res.status(500).json({ message: "Rental failed" });
  }
});

/* =========================
   RETURN BOOK
========================= */
router.put("/:id/return", auth, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);
    if (!rental) {
      return res.status(404).json({ message: "Rental not found" });
    }

    rental.status = "returned";
    rental.returnedAt = new Date();
    await rental.save();

    const book = await Book.findById(rental.book);
    book.status = "available";
    await book.save();

    res.json({ message: "Book returned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Return failed" });
  }
});

module.exports = router;
