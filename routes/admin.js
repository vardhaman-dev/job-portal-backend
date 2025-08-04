const express = require('express');
const router = express.Router();
const { loginValidator } = require('../validations/authValidators');
const { isLoggedIn, isAdmin } = require('../middleware/authMiddleware');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * @swagger
 * /api/admin/verify-token:
 *   get:
 *     summary: Verify admin token
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid or missing token
 */
router.get('/verify-token', isLoggedIn, isAdmin, async (req, res) => {
  try {
    // If we got here, the token is valid and user is admin
    res.json({
      success: true,
      admin: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying token'
    });
  }
});

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', loginValidator, async (req, res, next) => {
  console.log('Admin login request received:', { email: req.body.email });
  
  try {
    const { email, password } = req.body;
    
    console.log('Looking for admin user with email:', email);
    
    // Find admin user
    const admin = await User.scope('withPassword').findOne({
      where: { 
        email,
        role: 'admin',
        status: 'active' 
      }
    });
    
    console.log('Admin user found:', !!admin);

    // Check if admin exists and password is correct
    if (!admin || !(await admin.validPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Debug logging
    console.log('Creating JWT token for admin:', { id: admin.id, email: admin.email });
    console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined');
    
    // Create JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );
    
    console.log('Token created successfully:', token.substring(0, 10) + '...');

    // Return token and admin data
    res.json({
      success: true,
      token: 'Bearer ' + token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      },
      redirectTo: '/admin/dashboard'  // Frontend should handle this redirect
    });

  } catch (error) {
    console.error('Admin login error:', error);
    next(error);
  }
});

// Protected admin routes
router.use(isLoggedIn, isAdmin);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the admin dashboard',
    admin: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

module.exports = router;
