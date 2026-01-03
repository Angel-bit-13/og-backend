const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const Rental = require("../models/Rental");

// ============================
// GET ALL BOOKS (ADMIN)
// ============================
router.get("/books", auth, admin, async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// CREATE A BOOK (ADMIN)
// ============================
router.post("/admin", auth, admin, async (req, res) => {
  try {
    const { title, author, publicationYear, genre, ISBN } = req.body;

    const existingBook = await Book.findOne({ ISBN });
    if (existingBook) {
      return res.status(400).json({ message: "Book with this ISBN already exists" });
    }

    const newBook = new Book({ title, author, publicationYear, genre, ISBN });
    await newBook.save();

    res.status(201).json({ message: "Book added successfully", book: newBook });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// UPDATE BOOK (ADMIN)
// ============================
router.put("/:id", auth, admin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book updated", book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// DELETE BOOK (ADMIN)
// ============================
router.delete("/:id", auth, admin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json({ message: "Book deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// RENT A BOOK (USER)
// ============================
router.post("/rent/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (book.status === "rented") {
      return res.status(400).json({ message: "Book already rented" });
    }

    // Set due date 7 days from now
    const rentedAt = new Date();
    const expiresAt = new Date(rentedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update book status
    book.status = "rented";
    await book.save();

    // Create rental
    const rental = await Rental.create({
      user: req.user._id,
      book: book._id,
      rentedAt,
      expiresAt,
      status: "active",
    });

    res.status(201).json({ message: "Book rented successfully", rental });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Rent failed" });
  }
});

// ============================
// RETURN A BOOK (USER)
// ============================
router.post("/return/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    book.status = "available";
    await book.save();

    // Update the rental record
    const rental = await Rental.findOneAndUpdate(
      { book: book._id, status: "active" },
      { status: "returned", returnedAt: new Date() },
      { new: true }
    );

    res.json({ message: "Book returned successfully", rental });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Return failed" });
  }
});

// ============================
// LIKE A BOOK
// ============================
router.post("/like/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userId = req.user._id;
    if (book.likedBy.includes(userId)) {
      return res.status(400).json({ message: "You already liked this book" });
    }

    book.likedBy.push(userId);
    await book.save();

    res.json({ message: "Book liked successfully", book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// GET ALL BOOKS
// ============================
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ============================
// GET SINGLE BOOK BY ID
// ============================
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
