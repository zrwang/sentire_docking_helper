import { create } from 'zustand';
import type { Room } from '@/types/room';

const STORAGE_KEY = 'sentire.savedLayouts.v1';

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

interface LayoutsState {
  layouts: Record<string, SavedLayout>;
  save: (name: string, room: Room) => void;
  remove: (name: string) => void;
  get: (name: string) => SavedLayout | undefined;
}

export const useLayoutsStore = create<LayoutsState>((set, getState) => ({
  layouts: load(),
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
      return { layouts: next };
    }),
  get: (name) => getState().layouts[name],
}));
