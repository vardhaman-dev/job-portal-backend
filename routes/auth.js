// routes/auth.js
const express = require("express");
const { signupValidator, loginValidator } = require("../utils/validators");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signupValidator, registerUser);
router.post("/login", loginValidator, loginUser);

module.exports = router;
