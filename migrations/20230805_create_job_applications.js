'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('job_applications', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      job_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE'
      },
      job_seeker_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      cover_letter: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      resume_link: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('applied', 'reviewed', 'rejected', 'accepted'),
        defaultValue: 'applied',
        allowNull: false
      },
      applied_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('job_applications');
  }
};
