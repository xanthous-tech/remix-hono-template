import {
  pgTable,
  timestamp,
  text,
  unique,
  integer,
  varchar,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

import { Role } from '@/types/roles';

export const magicLinkTokenTable = pgTable('magic_link_token', {
  id: varchar('id').primaryKey().notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
});

export type MagicLinkToken = InferSelectModel<typeof magicLinkTokenTable>;

export const userTable = pgTable('user', {
  id: varchar('id').primaryKey().notNull(),
  email: text('email').unique('uniqueOnEmail', { nulls: 'distinct' }),
  password: text('password'),
  name: text('name'),
  image: text('image'),
  customerId: text('customer_id'),
  roleLevel: integer('role_level').default(Role.User),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
});

export type User = InferSelectModel<typeof userTable>;

export const accountTable = pgTable(
  'account',
  {
    id: varchar('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => userTable.id),
    provider: varchar('provider').notNull(),
    providerAccountId: varchar('provider_account_id').notNull(),
    idToken: text('id_token'),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  },
  (t) => ({
    uniqueOnProvider: unique().on(t.provider, t.providerAccountId),
  }),
);

export type Account = InferSelectModel<typeof accountTable>;

export const sessionTable = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),
});

export type Session = InferSelectModel<typeof sessionTable>;
