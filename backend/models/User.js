const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Basic financial info (for your project concept)
  monthlyIncome: { type: Number, default: 0 },
  monthlyBudget: { type: Number, default: 0 },

  // Simple reset system
  resetToken: String
});

module.exports = mongoose.model("User", userSchema);