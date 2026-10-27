// POST /api/sync: push local sessions, pull everything changed on the server since `since`.
// Last write wins on `updatedAt`; tombstones sync like any other row; rows are scoped to the Clerk user.
import { verifyToken } from '@clerk/backend';
import { and, eq, gte, sql } from 'drizzle-orm';

import { mergeSessions, parseSyncBody } from '@/lib/backup';
import type { Session } from '@/lib/types';
import { db, sessions } from '@/server/db';

const iso = (d: Date | null) => d?.toISOString();

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '');
  const userId = token
    ? await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY }).then((p) => p.sub, () => null)
    : null;
  if (!userId) return Response.json({ error: 'unauthorized' }, { status: 401 });

  let body: ReturnType<typeof parseSyncBody>;
  try {
    body = parseSyncBody(await request.json());
  } catch {
    return Response.json({ error: 'bad request' }, { status: 400 });
  }

  const incoming = mergeSessions([], body.changes); // one row per id, newest wins
  const d = db();
  if (incoming.length) {
    await d
      .insert(sessions)
      .values(
        incoming.map((s) => ({
          ...s,
          userId,
          startedAt: new Date(s.startedAt),
          updatedAt: new Date(s.updatedAt),
          deletedAt: s.deletedAt ? new Date(s.deletedAt) : null,
        })),
      )
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          startedAt: sql`excluded.started_at`,
          durationSec: sql`excluded.duration_sec`,
          mode: sql`excluded.mode`,
          goalSec: sql`excluded.goal_sec`,
          tension: sql`excluded.tension`,
          note: sql`excluded.note`,
          updatedAt: sql`excluded.updated_at`,
          deletedAt: sql`excluded.deleted_at`,
          syncedAt: sql`now()`,
        },
        // Newer edits only, and never across users (ids are client UUIDs).
        setWhere: sql`${sessions.updatedAt} < excluded.updated_at and ${sessions.userId} = excluded.user_id`,
      });
  }

  // `gte`: the cursor is truncated to ms, so the last rows may come back again; merging them is a no-op.
  // ponytail: a write committing late with an older now() can slip past a cursor; add a sequence if that shows up.
  const rows = await d
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), body.since ? gte(sessions.syncedAt, new Date(body.since)) : undefined));

  const changes: Session[] = rows.map((r) => ({
    id: r.id,
    startedAt: r.startedAt.toISOString(),
    durationSec: r.durationSec,
    mode: r.mode as Session['mode'],
    goalSec: r.goalSec ?? undefined,
    tension: (r.tension as Session['tension']) ?? undefined,
    note: r.note ?? undefined,
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: iso(r.deletedAt),
  }));
  const cursor = rows.reduce((max, r) => (r.syncedAt > max ? r.syncedAt : max), new Date(body.since ?? 0));
  return Response.json({ cursor: cursor.toISOString(), changes });
}
