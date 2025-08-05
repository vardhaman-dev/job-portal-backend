const { sequelize } = require('../config/database');
const User = require('./User');
const CompanyProfile = require('./CompanyProfile');
const JobSeekerProfile = require('./JobSeekerProfile');
const Job = require('./Job');

const AdminLog = require('./AdminLog');
const JobApplication = require('./JobApplication')(sequelize);
// JobApplication associations
Job.hasMany(JobApplication, { foreignKey: 'job_id', as: 'applications' });
JobApplication.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

User.hasMany(JobApplication, { foreignKey: 'job_seeker_id', as: 'jobApplications' });
JobApplication.belongsTo(User, { foreignKey: 'job_seeker_id', as: 'jobSeeker' });

 
// Define associations
// User to CompanyProfile (One-to-One)
User.hasOne(CompanyProfile, {
  foreignKey: 'userId',
  as: 'companyProfile',
  onDelete: 'CASCADE',
  hooks: true
});

CompanyProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User to JobSeekerProfile (One-to-One)
User.hasOne(JobSeekerProfile, {
  foreignKey: 'userId',
  as: 'jobSeekerProfile',
  onDelete: 'CASCADE',
  hooks: true
});

JobSeekerProfile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Set up associations for AdminLog (One-to-Many)
User.hasMany(AdminLog, {
  foreignKey: 'adminId',
  as: 'adminLogs',
  onDelete: 'CASCADE'
});

AdminLog.belongsTo(User, {
  foreignKey: 'adminId',
  as: 'admin'
});


module.exports = {
  sequelize,
  User,
  CompanyProfile,
  JobSeekerProfile,
  Job,
  AdminLog,
  JobApplication
};
