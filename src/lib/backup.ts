import type { Session, SessionMode, Tension } from './types';

const MODES: SessionMode[] = ['free', 'timed', 'peak'];
const TENSIONS: Tension[] = ['intense', 'tense', 'mild', 'easy'];

export function serializeBackup(sessions: Session[], now = new Date()): string {
  return JSON.stringify({ app: 'gvozdi', version: 1, exportedAt: now.toISOString(), sessions }, null, 2);
}

const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

/** Validates one untrusted session (backup file or sync request); throws if it isn't one. Unknown fields are dropped. */
export function parseSession(s: Record<string, unknown>): Session {
  if (
    typeof s?.id !== 'string' ||
    s.id.length > 64 ||
    !isDate(s.startedAt) ||
    typeof s.durationSec !== 'number' ||
    !(s.durationSec >= 0) ||
    !MODES.includes(s.mode as SessionMode)
  )
    throw new Error('bad session');
  return {
    id: s.id,
    startedAt: s.startedAt,
    durationSec: Math.round(s.durationSec),
    mode: s.mode as SessionMode,
    goalSec: typeof s.goalSec === 'number' && s.goalSec > 0 ? Math.round(s.goalSec) : undefined,
    tension: TENSIONS.includes(s.tension as Tension) ? (s.tension as Tension) : undefined,
    note: typeof s.note === 'string' && s.note ? s.note.slice(0, 2000) : undefined,
    updatedAt: isDate(s.updatedAt) ? s.updatedAt : s.startedAt,
    deletedAt: isDate(s.deletedAt) ? s.deletedAt : undefined,
  };
}

/** Validates an untrusted backup file; throws if it isn't one. */
export function parseBackup(text: string): Session[] {
  const data = JSON.parse(text);
  if (data?.app !== 'gvozdi' || !Array.isArray(data.sessions)) throw new Error('not a gvozdi backup');
  return data.sessions.map(parseSession);
}

export const SYNC_MAX_CHANGES = 2000;

/** Validates an untrusted `POST /api/sync` body; throws if it isn't one. */
export function parseSyncBody(data: unknown): { since: string | null; changes: Session[] } {
  const b = data as { since?: unknown; changes?: unknown };
  if (!Array.isArray(b?.changes) || b.changes.length > SYNC_MAX_CHANGES) throw new Error('bad changes');
  if (b.since != null && !isDate(b.since)) throw new Error('bad since');
  return { since: (b.since as string | undefined) ?? null, changes: b.changes.map(parseSession) };
}

/**
 * Union by id; on conflict the newer `updatedAt` wins (same rule as sync).
 * Returns `current` itself when nothing is newer, so callers can skip a store write.
 */
export function mergeSessions(current: Session[], incoming: Session[]): Session[] {
  const byId = new Map(current.map((s) => [s.id, s]));
  let changed = false;
  for (const s of incoming) {
    const old = byId.get(s.id);
    if (!old || s.updatedAt > old.updatedAt) {
      byId.set(s.id, s);
      changed = true;
    }
  }
  return changed ? [...byId.values()] : current;
}
