'use strict';

const { User } = require('../models');
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Only proceed if no admin exists
    const adminExists = await User.findOne({
      where: { role: 'admin' }
    });

    if (adminExists) {
      console.log('Admin user already exists, skipping creation');
      return;
    }

    // Generate a secure random password
    const password = generateSecurePassword();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create admin user
    await User.create({
      name: 'System Administrator',
      email: 'admin@jobportal.local',
      password_hash: passwordHash,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { isAdminCreation: true });

    console.log('========================================');
    console.log('ADMIN ACCOUNT CREATED');
    console.log('Email: admin@jobportal.local');
    console.log(`Password: ${password}`);
    console.log('IMPORTANT: Change this password immediately after first login!');
    console.log('========================================');
  },

  async down (queryInterface, Sequelize) {
    // No rollback for security reasons
    console.log('Admin account creation cannot be rolled back for security reasons');
  }
};

// Generate a secure random password
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\\:;?><,./-=';
  let password = '';
  
  // Ensure at least one of each character type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26));
  password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
  password += '0123456789'.charAt(Math.floor(Math.random() * 10));
  password += '!@#$%^&*()_+~`|}{[]\\:;?><,./-='.charAt(Math.floor(Math.random() * 26));
  
  // Fill the rest of the password
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
