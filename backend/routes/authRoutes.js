const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.headers.authorization;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, password, monthlyIncome, monthlyBudget, securityQuestion, securityAnswer } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed, monthlyIncome, monthlyBudget, securityQuestion, securityAnswer });
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
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CURRENT USER
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE INCOME AND BUDGET
router.put("/update", auth, async (req, res) => {
  try {
    const { monthlyIncome, monthlyBudget } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { monthlyIncome, monthlyBudget },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SECURITY QUESTION
router.post("/security-question", async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });
  res.json({ question: user.securityQuestion });
});

// SECURITY RESET
router.post("/security-reset", async (req, res) => {
  const { username, answer, newPassword } = req.body;
  const user = await User.findOne({ username });
  if (!user || user.securityAnswer !== answer)
    return res.status(400).json({ error: "Invalid answer" });
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password updated" });
});

// REQUEST PASSWORD RESET
router.post("/reset-request", async (req, res) => {
  const { username } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });
  const token = Math.random().toString(36).substring(2);
  user.resetToken = token;
  await user.save();
  res.json({ message: "Reset token created", token });
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