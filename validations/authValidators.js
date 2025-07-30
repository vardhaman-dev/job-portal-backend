const { body, oneOf } = require('express-validator');

// Common login validation for both job seekers and companies
const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
    
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Common registration validation for both job seekers and companies
const registerValidator = [
  // Common fields
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
  body('role')
    .isIn(['job_seeker', 'company']).withMessage('Invalid role'),
    
  // Company specific fields (only required when role is company)
  oneOf([
    body('role').not().equals('company'),
    body('companyName')
      .trim()
      .notEmpty().withMessage('Company name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),
    body('contactNumber')
      .optional()
      .isMobilePhone().withMessage('Please provide a valid contact number'),
    body('website')
      .optional()
      .isURL().withMessage('Please provide a valid website URL'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string'),
    body('industry')
      .optional()
      .isString().withMessage('Industry must be a string'),
    body('location')
      .optional()
      .isString().withMessage('Location must be a string')
  ], {
    message: 'Company information is required when role is company',
    errorType: 'company_validation_error'
  }),
  
  // Job seeker specific fields (only required when role is job_seeker)
  oneOf([
    body('role').not().equals('job_seeker'),
    body('resumeLink')
      .optional()
      .isURL().withMessage('Please provide a valid resume URL'),
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
  ], {
    message: 'Job seeker information is required when role is job_seeker',
    errorType: 'job_seeker_validation_error'
  })
];

module.exports = {
  loginValidator,
  registerValidator
};
