import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Clock } from '@/lib/session';
import type { Session, SessionMode, Settings } from '@/lib/types';

/** The session on the board right now; persisted so an OS kill or reload resumes it. */
export type Running = { mode: SessionMode; goalSec: number; clock: Clock };

type NewSession = Omit<Session, 'id' | 'updatedAt' | 'deletedAt'>;

type State = {
  sessions: Session[]; // includes tombstones; use live() from lib/practice for display
  settings: Settings;
  addSession: (s: NewSession) => Session;
  updateSession: (id: string, patch: Partial<Pick<Session, 'tension' | 'note'>>) => void;
  deleteSession: (id: string) => void;
  replaceSessions: (sessions: Session[]) => void;
  clearSessions: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  syncCursor?: string; // server time of the last pull; cleared on sign-out
  setSyncCursor: (cursor?: string) => void;
  running?: Running;
  setRunning: (running?: Running) => void;
};

const now = () => new Date().toISOString();

export const useStore = create<State>()(
  persist(
    (set) => ({
      sessions: [],
      settings: {
        language: 'system',
        theme: 'system',
        sound: true,
        haptics: true,
      },
      addSession: (s) => {
        const session = { ...s, id: randomUUID(), updatedAt: now() };
        set((st) => ({ sessions: [...st.sessions, session] }));
        return session;
      },
      updateSession: (id, patch) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: now() } : s)) })),
      deleteSession: (id) =>
        set((st) => ({
          sessions: st.sessions.map((s) => (s.id === id ? { ...s, deletedAt: now(), updatedAt: now() } : s)),
        })),
      replaceSessions: (sessions) => set({ sessions }),
      clearSessions: () =>
        set((st) => ({
          sessions: st.sessions.map((s) => (s.deletedAt ? s : { ...s, deletedAt: now(), updatedAt: now() })),
        })),
      setSettings: (patch) => set((st) => ({ settings: { ...st.settings, ...patch } })),
      setSyncCursor: (syncCursor) => set({ syncCursor }),
      setRunning: (running) => set({ running }),
    }),
    {
      name: 'gvozdi',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ sessions, settings, syncCursor, running }) => ({ sessions, settings, syncCursor, running }),
    },
  ),
);
