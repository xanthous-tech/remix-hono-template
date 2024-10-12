import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function runMigration() {
  const databaseUrl =
    process.env.DATABASE_URL_FOR_MIGRATION ??
    process.env.DATABASE_URL ??
    'postgresql://postgres:password@localhost:5432/template';
  console.log('Migrating database:', databaseUrl);
  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: 'migrations' });
  await sql.end();
}

runMigration();
