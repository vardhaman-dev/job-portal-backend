const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware to check if user is authenticated
 */
const isLoggedIn = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

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
 * Middleware to check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  
  res.status(403).json({ 
    success: false, 
    message: 'Admin access required' 
  });
};

module.exports = {
  isLoggedIn,
  isOwnerOrAdmin,
  isAdmin
};
