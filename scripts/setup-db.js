const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function setupDatabase() {
  const sql = postgres(process.env.DATABASE_URL);

  try {
    // Read and execute migrations in order
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrations = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const migrationPath = path.join(migrationsDir, migration);
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      await sql.unsafe(migrationSql);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setupDatabase(); 