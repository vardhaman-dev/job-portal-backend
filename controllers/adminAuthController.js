const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AdminLog = require('../models/AdminLog');
const { validationResult } = require('express-validator');

class AdminAuthController {
  /**
   * Admin login
   */
  static async login(req, res) {
    const t = await sequelize.transaction();
    
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('user-agent');

      // Input validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await this.logAdminAction(null, 'login_attempt', 'failed', {
          ipAddress,
          userAgent,
          error: 'Validation failed',
          details: errors.array()
        }, t);
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      // Find admin user
      const admin = await User.scope('withPassword').findOne({
        where: { 
          email,
          role: 'admin',
          status: 'active'
        },
        transaction: t
      });

      // Check if admin exists
      if (!admin) {
        await this.logAdminAction(null, 'login_attempt', 'failed', {
          ipAddress,
          userAgent,
          error: 'Invalid credentials',
          details: 'No admin found with this email'
        }, t);
        
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isMatch = await admin.validPassword(password);
      if (!isMatch) {
        await this.logAdminAction(admin.id, 'login_attempt', 'failed', {
          ipAddress,
          userAgent,
          error: 'Invalid credentials',
          details: 'Incorrect password'
        }, t);
        
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const payload = {
        id: admin.id,
        email: admin.email,
        role: 'admin',
        name: admin.name
      };

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      // Log successful login
      await this.logAdminAction(admin.id, 'login_success', 'success', {
        ipAddress,
        userAgent
      }, t);

      await t.commit();

      // Return token and admin data
      res.json({
        success: true,
        token: 'Bearer ' + token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        }
      });

    } catch (error) {
      await t.rollback();
      console.error('Admin login error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Server error during authentication',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(adminId, action, status, details = {}, transaction = null) {
    try {
      const logData = {
        adminId,
        action,
        status,
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        details: typeof details === 'object' ? JSON.stringify(details) : details
      };

      const options = {};
      if (transaction) options.transaction = transaction;
      
      await AdminLog.create(logData, options);
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't throw to avoid breaking the main operation
    }
  }
}

module.exports = AdminAuthController;
