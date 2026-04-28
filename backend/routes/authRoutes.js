const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, password, monthlyIncome, monthlyBudget } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashed,
      monthlyIncome,
      monthlyBudget
    });

    await user.save();

    res.json({ message: "User created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, "secretkey");

    res.json({ token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REQUEST PASSWORD RESET
router.post("/reset-request", async (req, res) => {
  const { username } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });

  const token = Math.random().toString(36).substring(2);
  user.resetToken = token;
  await user.save();

  res.json({ message: "Reset token created", token }); // show token for demo
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { username, token, newPassword } = req.body;

  const user = await User.findOne({ username });
  if (!user || user.resetToken !== token)
    return res.status(400).json({ error: "Invalid token" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;

  await user.save();

  res.json({ message: "Password updated" });
});

module.exports = router;