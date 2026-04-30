const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const jwt = require("jsonwebtoken");

// ======================
// AUTH MIDDLEWARE
// ======================
const auth = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  if (token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.log("TOKEN ERROR:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ======================
// CREATE EXPENSE
// ======================
router.post("/", auth, async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { title, amount, category, date } = req.body;

    // VALIDATION
    if (!title || !category || amount === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (isNaN(amount)) {
      return res.status(400).json({ error: "Amount must be a number" });
    }

    const expense = new Expense({
  title,
  amount,
  category,
  userId: req.userId,
  date: date ? new Date(date) : Date.now()
});

    const saved = await expense.save();
    res.json(saved);

  } catch (err) {
    console.log("CREATE EXPENSE ERROR:", err.message);

    // 🔥 HANDLE DUPLICATE TITLE ERROR
    if (err.code === 11000) {
      return res.status(400).json({
        error: "Please choose a new title"
      });
    }

    res.status(500).json({ error: err.message });
  }
});

// ======================
// GET USER EXPENSES
// ======================
router.get("/", auth, async (req, res) => {
  try {
    const expenses = await Expense.find({
      userId: req.userId
    }).sort({ date: -1 });

    res.json(expenses);
  } catch (err) {
    console.log("FETCH EXPENSE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ======================
// DELETE EXPENSE
// ======================
router.delete("/:id", auth, async (req, res) => {
  try {
    await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    res.json({ message: "Deleted" });
  } catch (err) {
    console.log("DELETE EXPENSE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;