// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const { loginUser } = require("../controllers/authController");

router.post("/login", loginUser);

// ✅ This line must exist:
module.exports = router;

