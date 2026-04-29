const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      password,
      monthlyIncome,
      monthlyBudget,
      securityQuestion,
      securityAnswer
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(
      securityAnswer.toLowerCase(),
      10
    );

    const user = new User({
      username,
      password: hashedPassword,
      monthlyIncome,
      monthlyBudget,
      securityQuestion,
      securityAnswer: hashedAnswer
    });

    await user.save();

    res.json({ message: "User created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= LOGIN =================
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

// ================= GET CURRENT USER =================
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) return res.status(401).json({ error: "No token" });

    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("-password");

    res.json(user);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ================= GET SECURITY QUESTION =================
router.post("/security-question", async (req, res) => {
  const { username } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });

  res.json({ question: user.securityQuestion });
});

// ================= RESET PASSWORD =================
router.post("/security-reset", async (req, res) => {
  const { username, answer, newPassword } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });

  const valid = await bcrypt.compare(
    answer.toLowerCase(),
    user.securityAnswer
  );

  if (!valid) return res.status(400).json({ error: "Wrong answer" });

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password reset successful" });
});

module.exports = router;