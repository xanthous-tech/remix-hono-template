import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  out: './migrations',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:password@localhost:5432/postgres',
  },
} satisfies Config;
