module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update the status column to use the correct ENUM values
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN status ENUM('active', 'inactive', 'banned') NOT NULL DEFAULT 'active'"
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to the previous ENUM values if needed
    await queryInterface.sequelize.query(
      "ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'pending'"
    );
  }
};
