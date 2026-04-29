const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  monthlyIncome: {
    type: Number,
    default: 0
  },
  monthlyBudget: {
    type: Number,
    default: 0
  },

  //  (security question system)
  securityQuestion: {
    type: String,
    required: true
  },
  securityAnswer: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("User", userSchema);