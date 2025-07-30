const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Define the CompanyProfile model
const CompanyProfile = sequelize.define('CompanyProfile', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  companyName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'company_name',
  },
  contactNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'contact_number',
  },
  logo: {
    type: DataTypes.STRING(512),
    allowNull: true,
    field: 'logo',
  },
  website: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  industry: {
    type: DataTypes.STRING(128),
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'location',
  },
}, {
  tableName: 'company_profiles',
  timestamps: false, // Disable timestamps since they don't exist in the database
  underscored: true,
});

module.exports = CompanyProfile;
