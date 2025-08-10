const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JobApplication = sequelize.define('JobApplication', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    job_seeker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cover_letter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resume_link: {
  type: DataTypes.STRING(512),
  allowNull: true,
},
status: {
  type: DataTypes.STRING(20),
  defaultValue: 'applied',
},

    applied_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'applications',
    timestamps: false,
  });
  return JobApplication;
};
