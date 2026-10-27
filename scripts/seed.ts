// Seeds a test account with ~5 weeks of practice: npm run db:seed -- <clerk user id>
// Idempotent: fixed ids (seed-*), re-running resets those rows. The app pulls them on sign-in.
import { neon } from '@neondatabase/serverless';

const userId = process.argv[2];
if (!userId?.startsWith('user_')) throw new Error('usage: npm run db:seed -- user_xxx');

const sql = neon(process.env.DATABASE_URL!);
const day = 86_400_000;
const today = new Date();
today.setHours(8, 0, 0, 0);

const modes = ['peak', 'timed', 'free'] as const;
const tensions = ['intense', 'tense', 'mild', 'easy'] as const;
const notes = ['Sharp at first, calm by minute three.', 'Legs shaky today.', 'Best one yet — barely noticed the nails.', 'Evening session, slept well after.'];
const skip = new Set([3, 4, 9, 17, 18, 19, 26]); // gaps before day 3 leave a 2-day current streak; 5..16 is the longest run

const rows = [];
for (let ago = 35; ago >= 1; ago--) {
  if (skip.has(ago)) continue;
  const n = 35 - ago; // 0 = oldest; minutes grow as the feet adapt
  const mode = modes[n % 3];
  const min = Math.min(30, 2 + Math.floor(n * 0.7));
  const at = today.getTime() - ago * day + (n % 4) * 3_600_000;
  rows.push({ id: `seed-${ago}`, at, durationSec: min * 60 + (n % 7) * 9, mode, goalSec: mode === 'free' ? null : min * 60, tension: tensions[Math.min(3, Math.floor(n / 9))], note: n % 5 === 0 ? notes[(n / 5) % 4] : null, deleted: false });
}
rows.push({ id: 'seed-1b', at: today.getTime() - day + 11 * 3_600_000, durationSec: 600, mode: 'timed', goalSec: 600, tension: 'easy', note: 'Second round, after work.', deleted: false });
rows.push({ id: 'seed-deleted', at: today.getTime() - 2 * day, durationSec: 30, mode: 'free', goalSec: null, tension: null, note: null, deleted: true }); // tombstone

const now = new Date().toISOString();
for (const r of rows)
  await sql`insert into sessions (id, user_id, started_at, duration_sec, mode, goal_sec, tension, note, updated_at, deleted_at, synced_at)
    values (${r.id}, ${userId}, ${new Date(r.at).toISOString()}, ${r.durationSec}, ${r.mode}, ${r.goalSec}, ${r.tension}, ${r.note}, ${now}, ${r.deleted ? now : null}, now())
    on conflict (id) do update set user_id = excluded.user_id, started_at = excluded.started_at, duration_sec = excluded.duration_sec, mode = excluded.mode,
      goal_sec = excluded.goal_sec, tension = excluded.tension, note = excluded.note, updated_at = excluded.updated_at, deleted_at = excluded.deleted_at, synced_at = now()`;

console.log(`seeded ${rows.length} sessions for ${userId}`);
