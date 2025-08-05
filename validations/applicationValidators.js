const { body } = require('express-validator');

exports.applyJobValidator = [
  body('job_id').isInt().withMessage('Job ID is required and must be an integer'),
  body('cover_letter').optional().isString(),
  body('resume_link').optional().isString().isURL().withMessage('Resume link must be a valid URL'),
];
