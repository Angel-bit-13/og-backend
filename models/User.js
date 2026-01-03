const mongoose = require("mongoose");

// schema means structure of the user data
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    place: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true  // prevent duplicate emails
    },
    education: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    likedBooks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
    }],
    rentedBooksCount: {
        type: Number,
        default: 0
    }
});

// export the model so other files can use it
module.exports = mongoose.model("User", userSchema);
