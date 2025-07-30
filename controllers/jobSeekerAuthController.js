const { validationResult } = require('express-validator');
const { User, JobSeekerProfile } = require('../models');
const BaseAuthController = require('./baseAuthController');

class JobSeekerAuthController extends BaseAuthController {
  /**
   * Register a new job seeker
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { name, email, password, resumeLink, experienceYears, skills = [] } = req.body;

      // Check if email exists
      if (await User.findOne({ where: { email } })) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }

      // Create user and profile
      const user = await User.create({
        email,
        password_hash: password,
        name: name || email.split('@')[0], // Use name or extract from email
        role: 'job_seeker',
        status: 'active'
      });

      const jobSeekerProfile = await JobSeekerProfile.create({
        userId: user.id,
        resumeLink,
        experienceYears: experienceYears || 0,
        skillsJson: skills
      });

      return this.handleSuccessfulAuth(res, user, 'jobSeeker', jobSeekerProfile);

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Login a job seeker
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { email, password } = req.body;
      
      // Find user with profile
      const user = await User.scope('withPassword').findOne({
        where: { 
          email,
          role: 'job_seeker',
          status: 'active'
        },
        include: [{
          model: JobSeekerProfile,
          as: 'jobSeekerProfile',
          required: true
        }]
      });

      // Validate credentials
      if (!user || !(await user.validPassword(password))) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      return this.handleSuccessfulAuth(res, user, 'jobSeeker');

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// Create an instance of the controller
const jobSeekerAuthController = new JobSeekerAuthController();

// Export individual methods for use in routes
const registerJobSeeker = (req, res) => jobSeekerAuthController.register(req, res);
const loginJobSeeker = (req, res) => jobSeekerAuthController.login(req, res);

module.exports = {
  registerJobSeeker,
  loginJobSeeker
};
