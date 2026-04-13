import { create } from 'zustand';
import type { EquipmentType } from '@/types/room';

const STORAGE_KEY = 'sentire.hiddenPaletteTypes.v1';

function load(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persist(types: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  } catch {
    // ignore quota / private mode
  }
}

interface PaletteVisibilityState {
  /** Equipment types the user has hidden from the sidebar palette. */
  hidden: string[];
  isHidden: (type: EquipmentType) => boolean;
  hide: (type: EquipmentType) => void;
  unhide: (type: EquipmentType) => void;
  restoreAll: () => void;
}

export const usePaletteVisibilityStore = create<PaletteVisibilityState>(
  (set, get) => ({
    hidden: load(),
    isHidden: (type) => get().hidden.includes(type as string),
    hide: (type) =>
      set((state) => {
        if (state.hidden.includes(type as string)) return state;
        const next = [...state.hidden, type as string];
        persist(next);
        return { hidden: next };
      }),
    unhide: (type) =>
      set((state) => {
        const next = state.hidden.filter((t) => t !== (type as string));
        persist(next);
        return { hidden: next };
      }),
    restoreAll: () => {
      persist([]);
      set({ hidden: [] });
    },
  })
);
