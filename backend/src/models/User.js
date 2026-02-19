const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    age: Number,
    school: String,
    program: String,
    major: String,
    is_verified: { type: Boolean, default: false },
    interest_tags: [String]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
