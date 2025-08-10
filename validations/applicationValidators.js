const { body } = require('express-validator');

exports.applyJobValidator = [
  body('job_id')
    .exists().withMessage('Job ID is required')
    .bail()
    .isInt().withMessage('Job ID must be an integer')
    .toInt(),

  body('cover_letter')
    .optional()
    .isString().withMessage('Cover letter must be a string'),
    
  // Remove resume_link validation as you upload file instead
];
