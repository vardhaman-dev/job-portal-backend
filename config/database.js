const { Sequelize } = require('sequelize');
require('dotenv').config(); // This loads decrypted env when running with dotenvx

const fs = require('fs');

// Convert port to number to avoid type issues
const dbPort = Number(process.env.DB_PORT) || 3306;

// Log decrypted env values for debugging (remove in production)
console.log({
  host: process.env.DB_HOST,
  port: dbPort,
  user: process.env.DB_USER,
  dbName: process.env.DB_NAME,
  ssl: process.env.DB_SSL
});

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: dbPort,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 60000, // Increase pool acquire timeout
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 30000, // 30 sec connect timeout
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false,
        // ca: fs.readFileSync('path/to/ca-certificate.crt'), // Uncomment if CA cert is needed
      } : false,
      typeCast: function (field, next) {
        if (field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
          return field.string();
        }
        return next();
      },
    },
    timezone: '+00:00', // UTC timezone
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  testConnection,
};
