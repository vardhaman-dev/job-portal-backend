const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authMiddleware');

const { applyToJob, getMyApplications } = require('../controllers/jobApplicationController');
const { applyJobValidator } = require('../validations/applicationValidators');
const { validate } = require('../middleware/validationMiddleware');


// POST /apply - Apply to a job
router.post('/apply', isLoggedIn, applyJobValidator, validate, applyToJob);

// GET /my-applications - Get all applications for the logged-in job seeker
router.get('/my-applications', isLoggedIn, getMyApplications);

module.exports = router;
