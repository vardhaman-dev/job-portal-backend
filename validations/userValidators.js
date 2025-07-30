const { body, param } = require('express-validator');

// Common validations
const commonValidations = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
    
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

// Job seeker profile validations
const jobSeekerProfileValidations = [
  body('resumeLink')
    .optional()
    .isURL()
    .withMessage('Please provide a valid URL for resume'),
    
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 80 })
    .withMessage('Experience years must be between 0 and 80'),
    
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array of strings')
];

// Company profile validations
const companyProfileValidations = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name must be between 2 and 255 characters'),
    
  body('contactNumber')
    .optional()
    .trim()
    .matches(/^[\d\s\-+()]+$/)
    .withMessage('Please provide a valid phone number'),
    
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
    
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
    
  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry must be less than 100 characters'),
    
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must be less than 255 characters')
];

// Middleware to validate user ID parameter
const validateUserId = [
  param('id')
    .isInt()
    .withMessage('User ID must be an integer')
    .toInt()
];

// Export validation chains
module.exports = {
  updateUserProfile: [
    ...validateUserId,
    ...commonValidations,
    (req, res, next) => {
      // Add role-specific validations based on user role
      if (req.user.role === 'job_seeker') {
        return [...jobSeekerProfileValidations];
      } else if (req.user.role === 'company') {
        return [...companyProfileValidations];
      }
      next();
    }
  ],
  
  deleteUser: validateUserId,
  getUserProfile: validateUserId
};
