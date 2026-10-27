// Client side of POST /api/sync. Runs while signed in: shortly after any session change and on app foreground.
import { useAuth } from '@clerk/expo';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useStore } from '@/store';
import { mergeSessions } from './backup';
import type { Session } from './types';

let busy = false;
let again = false;

// ponytail: pushes every session each time (a few KB per year of practice); send only dirty ids if that grows
async function syncOnce(token: string) {
  const { sessions, syncCursor } = useStore.getState();
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ since: syncCursor ?? null, changes: sessions }),
  });
  if (!res.ok) throw new Error(`sync ${res.status}`);
  const { cursor, changes } = (await res.json()) as { cursor: string; changes: Session[] };
  const st = useStore.getState(); // re-read: local edits made during the request must win if newer
  const merged = mergeSessions(st.sessions, changes);
  if (merged !== st.sessions) st.replaceSessions(merged);
  st.setSyncCursor(cursor);
}

async function run(getToken: () => Promise<string | null>) {
  if (busy) {
    again = true; // a change landed mid-sync; go once more when this one ends
    return;
  }
  busy = true;
  try {
    do {
      again = false;
      const token = await getToken();
      if (token) await syncOnce(token);
    } while (again);
  } catch {
    // offline or server down: the next change or foreground retries
  } finally {
    busy = false;
  }
}

export function useSync() {
  const { isSignedIn, getToken } = useAuth();
  const sessions = useStore((s) => s.sessions);

  useEffect(() => {
    if (!isSignedIn) return;
    const id = setTimeout(() => run(getToken), 1000);
    return () => clearTimeout(id);
  }, [isSignedIn, getToken, sessions]);

  useEffect(() => {
    if (!isSignedIn) return;
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run(getToken));
    return () => sub.remove();
  }, [isSignedIn, getToken]);
}
