const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class BaseAuthController {
  /**
   * Generate JWT token for a user
   * @param {Object} user - User instance
   * @returns {String} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Handle successful authentication
   * @param {Object} res - Express response object
   * @param {Object} user - User instance
   * @param {String} profileType - Type of profile ('company' or 'job_seeker')
   * @param {Object} profile - Profile data
   */
  async handleSuccessfulAuth(res, user, profileType, profile = null) {
    // Include profile data in the response if available
    const userData = user.get({ plain: true });
    
    const response = {
      success: true,
      token: this.generateToken(user),
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt,
      }
    };

    // Add profile data if available
    if (profile) {
      response[`${profileType}_profile`] = profile.get({ plain: true });
    } else if (user[`${profileType}Profile`]) {
      response[`${profileType}_profile`] = user[`${profileType}Profile`].get({ plain: true });
    }

    return res.status(200).json(response);
  }

  /**
   * Handle authentication errors
   * @param {Object} res - Express response object
   * @param {Error} error - Error object
   */
  handleAuthError(res, error) {
    console.error('Authentication error:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Handle other errors
    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }

  /**
   * Validate request using express-validator
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {boolean} True if validation passed, false otherwise
   */
  validateRequest(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return false;
    }
    return true;
  }
}

module.exports = BaseAuthController;
