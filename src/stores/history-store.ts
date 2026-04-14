import { create } from 'zustand';
import type { Room } from '@/types/room';

/**
 * Cap on how many states to retain. The room object is structurally shared
 * (equipment items are immutable), so each entry is cheap, but bounding the
 * stack keeps memory usage predictable across long editing sessions.
 */
const MAX_HISTORY = 100;

interface HistoryState {
  /** Past room snapshots. The newest entry is at the end. */
  past: Room[];
  /** Room snapshots that were undone, available for redo. */
  future: Room[];

  /**
   * Push a snapshot of the room state that's about to be replaced. Clears
   * the redo stack -- once the user takes a fresh action, the previously
   * undone branch is gone.
   */
  pushSnapshot: (room: Room) => void;

  /** Pop one snapshot from `past`, return it, push `current` onto `future`. */
  popUndo: (current: Room) => Room | null;

  /** Pop one snapshot from `future`, return it, push `current` onto `past`. */
  popRedo: (current: Room) => Room | null;

  /** Drop all history (e.g. when loading a brand-new layout). */
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  pushSnapshot: (room) =>
    set((state) => {
      const past = [...state.past, room];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, future: [] };
    }),

  popUndo: (current) => {
    const { past, future } = get();
    if (past.length === 0) return null;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [...future, current],
    });
    return prev;
  },

  popRedo: (current) => {
    const { past, future } = get();
    if (future.length === 0) return null;
    const next = future[future.length - 1];
    set({
      past: [...past, current],
      future: future.slice(0, -1),
    });
    return next;
  },

  clear: () => set({ past: [], future: [] }),
}));
