const express = require("express");
const mongoose = require("mongoose");
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

    const rentedAt = new Date();
    const expiresAt = new Date(rentedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    const rental = await Rental.create({
      user: req.user._id,
      book: book._id,
      rentedAt,
      expiresAt,
      status: "active",
    });

    book.status = "rented";
    book.rentedBy = req.user._id;
    await book.save();

    res.status(201).json(rental);
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

    if (book.status !== "rented") {
      return res.status(400).json({ message: "Book is not rented" });
    }

    if (book.rentedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You did not rent this book" });
    }

    // Find the rental
    const rental = await Rental.findOne({
      book: book._id,
      user: req.user._id,
      status: "active",
    });

    if (!rental) return res.status(404).json({ message: "Active rental not found" });

    // Ensure expiresAt exists (fix validation error)
    if (!rental.expiresAt) {
      rental.expiresAt = new Date(rental.rentedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // default 7 days
    }

    rental.status = "returned";
    rental.returnedAt = new Date();
    await rental.save();

    book.status = "available";
    book.rentedBy = null;
    await book.save();

    res.json({ message: "Book returned successfully", rental });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to return book" });
  }
});

// LIKE A BOOK (toggle)
router.post("/like/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userId = req.user._id.toString();

    // Remove dislike if exists
    if (book.dislikes.includes(userId)) {
      book.dislikes = book.dislikes.filter((id) => id.toString() !== userId);
    }

    // Toggle like
    if (book.likes.includes(userId)) {
      // Already liked → remove like (toggle off)
      book.likes = book.likes.filter((id) => id.toString() !== userId);
    } else {
      book.likes.push(userId);
    }

    await book.save();

    res.json({
      message: "Book like toggled",
      liked: book.likes.includes(userId),
      disliked: book.dislikes.includes(userId),
      likesCount: book.likes.length,
      dislikesCount: book.dislikes.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// DISLIKE A BOOK
router.post("/dislike/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const userId = req.user._id.toString();

    // Remove like if exists
    if (book.likes.includes(userId)) {
      book.likes = book.likes.filter((id) => id.toString() !== userId);
    }

    // Toggle dislike
    if (book.dislikes.includes(userId)) {
      // Already disliked → do nothing
    } else {
      book.dislikes.push(userId);
    }

    await book.save();

    res.json({
      message: "Book disliked",
      liked: book.likes.includes(userId),
      disliked: book.dislikes.includes(userId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================
// RATE A BOOK
// ============================
router.post("/rate/:id", auth, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating" });
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    book.ratings = book.ratings || [];

    // Remove old rating by user
    book.ratings = book.ratings.filter(
      (r) => r.user.toString() !== req.user._id.toString()
    );

    book.ratings.push({
      user: req.user._id,
      value: rating,
    });

    book.averageRating =
      book.ratings.reduce((sum, r) => sum + r.value, 0) /
      book.ratings.length;

    await book.save();

    res.json({ averageRating: book.averageRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Rating failed" });
  }
});

// ============================
// ADD COMMENT
// ============================
router.post("/comment/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Empty comment" });

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    book.comments = book.comments || [];

    const comment = {
      text,
      user: req.user._id,
      userName: req.user.name || "Anonymous",
      createdAt: new Date(),
    };

    book.comments.push(comment);
    await book.save();

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Comment failed" });
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
