const express = require('express');
const { login: unifiedLogin } = require('../controllers/unifiedAuthController');
const { loginValidator } = require('../validations/authValidators');

// Import job seeker auth
const jobSeekerAuthController = require('../controllers/jobSeekerAuthController');
const { registerJobSeekerValidator } = require('../validations/jobSeekerValidators');

// Import company auth
const companyAuthController = require('../controllers/companyAuthController');
const { registerCompanyValidator } = require('../validations/companyValidators');

const router = express.Router();

// Unified login route (works for both job seekers and companies)
router.post('/login', loginValidator, unifiedLogin);

// Job Seeker routes
router.post('/job-seeker/register', registerJobSeekerValidator, jobSeekerAuthController.registerJobSeeker);
router.post('/job-seeker/login', loginValidator, jobSeekerAuthController.loginJobSeeker);

// Company routes
router.post('/company/register', registerCompanyValidator, companyAuthController.registerCompany);
router.post('/company/login', loginValidator, companyAuthController.loginCompany);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Authentication service is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
