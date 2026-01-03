const express = require("express");
const auth = require("../middleware/authMiddleware");
const User = require("../models/User");
const admin = require("../middleware/adminMiddleware");
const router = express.Router();

// GET logged-in user's profile
router.get("/me", auth, async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = await User.findById(req.user.id)
      .select("-password") // exclude password
      .populate("likedBooks"); // populate book info if needed

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", auth, admin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE LOGGED-IN USER
router.put("/me", auth, async (req, res) => {
  try {
    const updates = req.body; // get all fields to update
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields
    Object.keys(updates).forEach((key) => {
      user[key] = updates[key];
    });

    await user.save();
    res.json(user); // send back updated user
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
