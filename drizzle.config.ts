import { defineConfig } from 'drizzle-kit';

// Run with the env loaded: npm run db:generate / npm run db:migrate
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
