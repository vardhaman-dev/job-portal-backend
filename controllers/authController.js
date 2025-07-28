// controllers/authController.js
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

exports.registerUser = async (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if email already exists
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Email is already registered" }] });
    }

    const hash = await bcrypt.hash(password, 12);
    // Store user (here, joining first and last names)
    const fullName = `${firstName} ${lastName}`.trim();
    await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [fullName, email, hash],
    );

    return res.status(201).json({ message: "User registered. Please login." });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ errors: [{ msg: "Server error" }] });
  }
};

exports.loginUser = async (req, res) => {
  // Validate user input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user by email
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    const user = rows[0];

    if (!user.password_hash) {
      return res
        .status(400)
        .json({
          errors: [
            {
              msg: "User registered via OAuth, please use that method to login",
            },
          ],
        });
    }

    // Compare password hashes
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: "Invalid credentials" }] });
    }

    // Create JWT token payload
    const payload = {
      userId: user.id,
      role: user.role,
      name: user.name,
    };

    // Sign JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "2d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ errors: [{ msg: "Server error" }] });
  }
};
