const { User, JobSeekerProfile, CompanyProfile } = require('../models');
const { sequelize } = require('../config/database');

class UserController {
  /**
   * Update user profile
   */
  static async updateUserProfile(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = parseInt(req.params.id);
      const { name, email, password, ...profileData } = req.body;
      
      // Find user
      const user = await User.findByPk(userId, {
        include: [
          { model: JobSeekerProfile, as: 'jobSeekerProfile' },
          { model: CompanyProfile, as: 'companyProfile' }
        ],
        transaction
      });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update basic user info
      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (password) updateData.password_hash = password;

      if (Object.keys(updateData).length > 0) {
        await user.update(updateData, { transaction });
      }

      // Update profile based on user role
      if (user.role === 'job_seeker' && user.jobSeekerProfile) {
        await user.jobSeekerProfile.update(profileData, { transaction });
      } else if (user.role === 'company' && user.companyProfile) {
        await user.companyProfile.update(profileData, { transaction });
      }

      await transaction.commit();
      
      // Fetch updated user with profile
      const updatedUser = await User.findByPk(userId, {
        include: [
          { model: JobSeekerProfile, as: 'jobSeekerProfile' },
          { model: CompanyProfile, as: 'companyProfile' }
        ],
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        user: updatedUser
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete user account
   */
  static async deleteUserAccount(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = parseInt(req.params.id);
      
      // Find user with profile
      const user = await User.findByPk(userId, {
        include: [
          { model: JobSeekerProfile, as: 'jobSeekerProfile' },
          { model: CompanyProfile, as: 'companyProfile' }
        ],
        transaction
      });

      if (!user) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete profile based on user role
      if (user.role === 'job_seeker' && user.jobSeekerProfile) {
        await user.jobSeekerProfile.destroy({ transaction });
      } else if (user.role === 'company' && user.companyProfile) {
        await user.companyProfile.destroy({ transaction });
      }

      // Delete user
      await user.destroy({ transaction });
      await transaction.commit();

      res.json({
        success: true,
        message: 'User account deleted successfully'
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting account',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(req, res) {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await User.findByPk(userId, {
        include: [
          { model: JobSeekerProfile, as: 'jobSeekerProfile' },
          { model: CompanyProfile, as: 'companyProfile' }
        ],
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = UserController;
