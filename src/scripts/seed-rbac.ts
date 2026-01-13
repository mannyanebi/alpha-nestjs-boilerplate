import { DataSource } from 'typeorm';

import { seedRbacData } from '../modules/rbac/seeders/seed-rbac.ts';

/**
 * Standalone script to seed RBAC data
 * Run with: npm run seed:rbac
 */
async function main() {
  // Create data source from environment variables
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'croptera',
    entities: [__dirname + '/../modules/**/*.entity.ts'],
    synchronize: false,
  });

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    await seedRbacData(dataSource);

    console.log('\n✨ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n👋 Database connection closed');
    }
  }
}

main();
