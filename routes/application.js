const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isLoggedIn } = require('../middleware/authMiddleware');
const { applyJobValidator } = require('../validations/applicationValidators');
const { validate } = require('../middleware/validationMiddleware');
const { applyToJob } = require('../controllers/jobApplicationController');

// Add logging wrappers around middleware to detect hangs
const logMiddleware = (name, fn) => (req, res, next) => {
  console.log(`[Middleware] ${name} start`);
  return fn(req, res, (...args) => {
    console.log(`[Middleware] ${name} end`);
    next(...args);
  });
};

// Setup multer storage and file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');  // make sure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC and DOCX files are allowed'));
  }
};

const upload = multer({ storage, fileFilter });

router.post(
  '/apply',
  logMiddleware('isLoggedIn', isLoggedIn),

  // Multer middleware before validation to parse multipart/form-data
  logMiddleware('upload.single', upload.single('resume')),

  // Validation runs after multer populates req.body
  logMiddleware('applyJobValidator', (req, res, next) => {
    Promise.all(applyJobValidator.map((v) => v.run(req)))
      .then(() => {
        console.log('[Middleware] applyJobValidator end');
        next();
      })
      .catch(next);
  }),

  logMiddleware('validate', validate([])),

  applyToJob
);

module.exports = router;
