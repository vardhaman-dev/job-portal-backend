const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');

const isLoggedIn = async (req, res, next) => {
  console.log('[AuthMiddleware] Start auth check');
  try {
    const authHeader = req.header('Authorization');
    console.log('[AuthMiddleware] Authorization header:', authHeader);
    if (!authHeader) {
      console.log('[AuthMiddleware] No Authorization header');
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    let token = authHeader;
    while (token.toLowerCase().startsWith('bearer ')) {
      token = token.substring(7).trim();
    }
    console.log('[AuthMiddleware] Token extracted:', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, jwtConfig.secret);
    console.log('[AuthMiddleware] Token decoded:', decoded);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      console.log('[AuthMiddleware] User not found');
      return res.status(401).json({ success: false, message: 'Token is not valid' });
    }
    console.log('[AuthMiddleware] User found:', user.email);

    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Error:', error);
    return res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

module.exports = { isLoggedIn };


/**
 * Middleware to check if user is the owner or admin
 */
const isOwnerOrAdmin = (req, res, next) => {
  // If user is admin, allow access
  if (req.user.role === 'admin') {
    return next();
  }

  // If user is trying to access their own profile
  if (req.user.id === parseInt(req.params.id)) {
    return next();
  }

  // If neither admin nor owner, deny access
  res.status(403).json({ 
    success: false, 
    message: 'Not authorized to access this resource' 
  });
};

/**
 * Middleware to check if user is admin with additional security checks
 */
const isAdmin = async (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify the user still exists and is an admin
    const user = await User.findByPk(req.user.id);
    
    if (!user || user.role !== 'admin' || user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Add admin-specific headers for security
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Continue to the route
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin privileges'
    });
  }
};

module.exports = {
  isLoggedIn,
  isOwnerOrAdmin,
  isAdmin
};
