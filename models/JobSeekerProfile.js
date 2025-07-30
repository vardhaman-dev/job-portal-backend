const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define the JobSeekerProfile model
const JobSeekerProfile = sequelize.define('JobSeekerProfile', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  resumeLink: {
    type: DataTypes.STRING(512),
    allowNull: true,
    field: 'resume_link',
  },
  experienceYears: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'experience_years',
  },
  skillsJson: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'skills_json',
    get() {
      const value = this.getDataValue('skillsJson');
      try {
        if (!value) return [];
        // If it's already an array, return it as is
        if (Array.isArray(value)) return value;
        // If it's a string, try to parse it
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        // For any other case, return empty array
        return [];
      } catch (error) {
        console.error('Error parsing skills JSON:', error);
        return [];
      }
    },
    set(value) {
      try {
        if (Array.isArray(value)) {
          this.setDataValue('skillsJson', JSON.stringify(value));
        } else if (typeof value === 'string') {
          // If it's a string, validate it's valid JSON
          JSON.parse(value);
          this.setDataValue('skillsJson', value);
        } else {
          this.setDataValue('skillsJson', '[]');
        }
      } catch (error) {
        console.error('Error setting skills JSON:', error);
        this.setDataValue('skillsJson', '[]');
      }
    }
  },
}, {
  tableName: 'job_seeker_profiles',
  timestamps: false,
  underscored: true,
});

module.exports = JobSeekerProfile;
