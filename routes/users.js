const express = require('express');
const router = express.Router();
const { isLoggedIn, isOwnerOrAdmin } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const { 
  updateUserProfile, 
  getUserProfile, 
  deleteUser 
} = require('../validations/userValidators');
const { validate } = require('../middleware/validationMiddleware');

// Get user profile (public)
router.get('/:id', validate(getUserProfile), userController.getUserProfile);

// Protected routes (require authentication)
router.use(isLoggedIn);

// Update user profile (owner or admin only)
router.patch(
  '/:id', 
  isOwnerOrAdmin, 
  validate(updateUserProfile), 
  userController.updateUserProfile
);

// Delete user account (owner or admin only)
router.delete(
  '/:id', 
  isOwnerOrAdmin, 
  validate(deleteUser), 
  userController.deleteUserAccount
);

module.exports = router;
