const jwt = require('jsonwebtoken');
const { User } = require('../models');
const jwtConfig = require('../config/jwt');

/**
 * Middleware to check if user is authenticated
 */
const isLoggedIn = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }
    
    // Extract token, handling different Bearer token formats
    let token = authHeader;
    
    // Debug logging before processing
    console.log('Raw Authorization header:', authHeader);
    
    // Remove ALL 'Bearer ' prefixes if present (case insensitive)
    if (token && typeof token === 'string') {
      // This will remove all instances of 'Bearer ' at the start of the string
      while (token.toLowerCase().startsWith('bearer ')) {
        token = token.substring(7).trim();
      }
      console.log('After removing Bearer prefixes:', token.substring(0, 10) + '...');
    }
    
    if (!token) {
      console.error('No token found in Authorization header');
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }

    // Debug logging
    console.log('Verifying token (first 10 chars):', token.substring(0, 10) + '...');
    console.log('JWT_SECRET length:', jwtConfig.secret ? jwtConfig.secret.length : 'undefined');
    console.log('Token length:', token.length);
    
    try {
      // Verify token
      console.log('Verifying with secret:', jwtConfig.secret ? '***' + jwtConfig.secret.slice(-4) : 'undefined');
      const decoded = jwt.verify(token, jwtConfig.secret);
      console.log('Token decoded successfully:', { id: decoded.id, email: decoded.email });
      
      // Find user and attach to request
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password_hash'] }
      });
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token is not valid' 
        });
      }
      console.log('User found:', { id: user.id, email: user.email });
      
      // Attach user to request object
      req.user = user;
    } catch (verifyError) {
      console.error('JWT verification failed:', verifyError.message);
      console.error('Token:', token);
      throw verifyError; // Re-throw to be caught by the outer catch
    }

    // Continue to next middleware
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
