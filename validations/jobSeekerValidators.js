const { body } = require('express-validator');

// Validation rules for job seeker registration
const registerJobSeekerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

  body('resumeLink')
    .optional()
    .isURL().withMessage('Resume link must be a valid URL'),

  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 50 }).withMessage('Experience must be between 0 and 50 years'),

  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array')
    .custom(skills => {
      if (!Array.isArray(skills)) return false;
      return skills.every(skill => typeof skill === 'string');
    }).withMessage('Each skill must be a string')
];

// Validation rules for job seeker login
const loginJobSeekerValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  registerJobSeekerValidator,
  loginJobSeekerValidator
};
