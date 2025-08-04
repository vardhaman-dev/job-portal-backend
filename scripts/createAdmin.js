require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`Email: ${existingAdmin.email}`);
      return;
    }

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@yourdomain.com',
      password_hash: await bcrypt.hash('SecureAdmin123!', 10),
      role: 'admin',
      status: 'active'
    };

    // Use direct query to bypass model validations
    const [userId] = await sequelize.query(
      `INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at) 
       VALUES (:name, :email, :password_hash, :role, :status, NOW(), NOW())`,
      {
        replacements: adminData,
        type: sequelize.QueryTypes.INSERT
      }
    );

    console.log('Admin user created successfully!');
    console.log(`ID: ${userId}`);
    console.log(`Email: ${adminData.email}`);
    console.log('Password: SecureAdmin123!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

createAdmin();
