const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminLog = sequelize.define('AdminLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',  // Reference the users table
      key: 'id',
    },
    field: 'admin_id'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g., login_attempt, login_success, login_failed'
  },
  ipAddress: {
    type: DataTypes.STRING,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  },
  status: {
    type: DataTypes.ENUM('success', 'failed'),
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT,
    comment: 'Additional details or error message'
  }
}, {
  tableName: 'admin_logs',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AdminLog;
