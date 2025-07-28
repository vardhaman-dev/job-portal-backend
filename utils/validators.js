// utils/validators.js
const { body } = require("express-validator");

// Validation for signup
const signupValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) throw new Error("Passwords do not match");
    return true;
  }),
  body("agree").equals("true").withMessage("You must agree to the terms"),
];

// Validation for login
const loginValidator = [
  body("email").isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = {
  signupValidator,
  loginValidator,
};
