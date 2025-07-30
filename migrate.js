const { sequelize } = require('./models');
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');

async function runMigrations() {
  try {
    console.log('Starting database migration...');
    
    // Configure Umzug
    const umzug = new Umzug({
      migrations: {
        glob: 'migrations/*.js',
        resolve: ({ name, path: filePath, context }) => {
          // Resolve the migration file
          const migration = require(filePath);
          return {
            name,
            up: async () => migration.up(context, context.sequelize.constructor),
            down: async () => migration.down(context, context.sequelize.constructor),
          };
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({ 
        sequelize,
        modelName: 'migration_meta',
        tableName: 'migration_meta',
      }),
      logger: console,
    });

    // Run migrations
    const migrations = await umzug.up();
    console.log(`Successfully ran ${migrations.length} migrations`);
    console.log('Database migration completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
