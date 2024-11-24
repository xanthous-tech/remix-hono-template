import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const queryClient = postgres(
  process.env.DATABASE_URL ??
    'postgresql://postgres:password@localhost:5432/template',
);

export const db = drizzle(queryClient, { schema });
