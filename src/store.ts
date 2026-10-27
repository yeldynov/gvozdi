import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Session, Settings } from '@/lib/types';

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
        onboarded: false,
        signupPrompt: { dismissals: 0 },
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
    }),
    {
      name: 'gvozdi',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ sessions, settings }) => ({ sessions, settings }),
    },
  ),
);
