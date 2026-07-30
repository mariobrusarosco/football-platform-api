import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations');
}

const runMigrations = async (): Promise<void> => {
  const sql = postgres(databaseUrl, { max: 1 });

  try {
    await migrate(drizzle(sql), {
      migrationsFolder: './drizzle',
      migrationsSchema: 'public',
      migrationsTable: '__drizzle_migrations',
    });
    console.log('Database migrations applied successfully.');
  } catch (error) {
    console.error('Database migration failed.');
    console.error(error);

    if (error instanceof Error && error.cause) {
      console.error('Database migration cause:');
      console.error(error.cause);
    }

    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
};

void runMigrations();
