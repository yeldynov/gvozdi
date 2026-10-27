// Server-only: imported by API routes, never by app code.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    startedAt: ts('started_at').notNull(),
    durationSec: integer('duration_sec').notNull(),
    mode: text('mode').notNull(),
    goalSec: integer('goal_sec'),
    tension: text('tension'),
    note: text('note'),
    updatedAt: ts('updated_at').notNull(), // client clock, decides last-write-wins
    deletedAt: ts('deleted_at'),
    syncedAt: ts('synced_at').notNull().defaultNow(), // server clock, the pull cursor
  },
  (t) => [index('sessions_user_synced').on(t.userId, t.syncedAt)],
);

export const db = () => drizzle({ client: neon(process.env.DATABASE_URL!) });
