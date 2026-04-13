import { create } from 'zustand';
import type { Room } from '@/types/room';

const STORAGE_KEY = 'sentire.savedLayouts.v1';
const DEMO_KEY = 'sentire.demoLayout.v1';

export interface SavedLayout {
  name: string;
  savedAt: number; // epoch ms
  room: Room;
}

function load(): Record<string, SavedLayout> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SavedLayout>) : {};
  } catch {
    return {};
  }
}

function persist(entries: Record<string, SavedLayout>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota / private-mode errors
  }
}

function loadDemoName(): string | null {
  try {
    return localStorage.getItem(DEMO_KEY);
  } catch {
    return null;
  }
}

function persistDemoName(name: string | null) {
  try {
    if (name) localStorage.setItem(DEMO_KEY, name);
    else localStorage.removeItem(DEMO_KEY);
  } catch {
    // ignore quota / private-mode errors
  }
}

interface LayoutsState {
  layouts: Record<string, SavedLayout>;
  /**
   * Name of the saved layout that should be loaded by the header's
   * "Load Demo" button. When null, the built-in Partial Nephrectomy
   * preset is used as a fallback.
   */
  demoName: string | null;
  save: (name: string, room: Room) => void;
  remove: (name: string) => void;
  get: (name: string) => SavedLayout | undefined;
  /** Pin a saved layout as the "demo", or clear with null. */
  setDemo: (name: string | null) => void;
}

export const useLayoutsStore = create<LayoutsState>((set, getState) => ({
  layouts: load(),
  demoName: loadDemoName(),
  save: (name, room) =>
    set((state) => {
      const entry: SavedLayout = { name, savedAt: Date.now(), room };
      const next = { ...state.layouts, [name]: entry };
      persist(next);
      return { layouts: next };
    }),
  remove: (name) =>
    set((state) => {
      const next = { ...state.layouts };
      delete next[name];
      persist(next);
      // If the deleted layout was the pinned demo, clear the pin too.
      if (state.demoName === name) {
        persistDemoName(null);
        return { layouts: next, demoName: null };
      }
      return { layouts: next };
    }),
  get: (name) => getState().layouts[name],
  setDemo: (name) => {
    persistDemoName(name);
    set({ demoName: name });
  },
}));
