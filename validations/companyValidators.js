const { body } = require('express-validator');

// Validation rules for company registration
const registerCompanyValidator = [
  // Company Information
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Company name must be between 2 and 255 characters'),

  // Authentication
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  // Contact Information
  body('contactNumber')
    .trim()
    .notEmpty().withMessage('Contact number is required')
    .matches(/^[\d\s\-+()]+$/).withMessage('Please provide a valid phone number')
    .isLength({ min: 5, max: 20 }).withMessage('Phone number must be between 5 and 20 characters'),

  // Company Details
  body('website')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Please provide a valid website URL')
    .isLength({ max: 255 }).withMessage('Website URL is too long'),

  body('logo')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Logo must be a valid URL')
    .isLength({ max: 512 }).withMessage('Logo URL is too long'),

  body('description')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),

  body('industry')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 100 }).withMessage('Industry must be less than 100 characters'),

  body('location')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 500 }).withMessage('Location must be less than 500 characters'),

  body('companySize')
    .optional({ checkFalsy: true })
    .isIn([
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5001+'
    ]).withMessage('Please select a valid company size'),

  body('foundedYear')
    .optional({ checkFalsy: true })
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage(`Please provide a valid year between 1800 and ${new Date().getFullYear()}`),

  body('linkedinUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Please provide a valid LinkedIn URL')
    .isLength({ max: 255 }).withMessage('LinkedIn URL is too long'),

  body('twitterHandle')
    .optional({ checkFalsy: true })
    .matches(/^@?(\w){1,15}$/).withMessage('Please provide a valid Twitter handle')
];

// Validation rules for company login
const loginCompanyValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  registerCompanyValidator,
  loginCompanyValidator
};
