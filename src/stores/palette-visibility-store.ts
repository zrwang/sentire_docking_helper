import { create } from 'zustand';
import type { EquipmentType } from '@/types/room';

const STORAGE_KEY = 'sentire.hiddenPaletteTypes.v1';
const DELETED_KEY = 'sentire.deletedPaletteTypes.v1';

function load(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function persist(key: string, types: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(types));
  } catch {
    // ignore quota / private mode
  }
}

interface PaletteVisibilityState {
  /** Types the user has hidden -- listed in the "Hidden" panel; restorable. */
  hidden: string[];
  /**
   * Types the user has *deleted* from the palette. Built-in entries can't
   * truly leave the catalog (they live in code), so "delete" means hidden
   * AND removed from the Hidden panel. They still appear in a separate
   * "Removed" list for recovery.
   */
  deleted: string[];
  isHidden: (type: EquipmentType) => boolean;
  isDeleted: (type: EquipmentType) => boolean;
  hide: (type: EquipmentType) => void;
  unhide: (type: EquipmentType) => void;
  /** Move a type from hidden -> deleted (removes from Hidden panel). */
  markDeleted: (type: EquipmentType) => void;
  /** Move a type out of deleted entirely (back to fully visible). */
  undelete: (type: EquipmentType) => void;
  restoreAll: () => void;
}

export const usePaletteVisibilityStore = create<PaletteVisibilityState>(
  (set, get) => ({
    hidden: load(STORAGE_KEY),
    deleted: load(DELETED_KEY),
    isHidden: (type) => get().hidden.includes(type as string),
    isDeleted: (type) => get().deleted.includes(type as string),
    hide: (type) =>
      set((state) => {
        if (state.hidden.includes(type as string)) return state;
        const next = [...state.hidden, type as string];
        persist(STORAGE_KEY, next);
        return { hidden: next };
      }),
    unhide: (type) =>
      set((state) => {
        const nextHidden = state.hidden.filter((t) => t !== (type as string));
        const nextDeleted = state.deleted.filter((t) => t !== (type as string));
        if (nextHidden.length !== state.hidden.length)
          persist(STORAGE_KEY, nextHidden);
        if (nextDeleted.length !== state.deleted.length)
          persist(DELETED_KEY, nextDeleted);
        return { hidden: nextHidden, deleted: nextDeleted };
      }),
    markDeleted: (type) =>
      set((state) => {
        const nextHidden = state.hidden.filter((t) => t !== (type as string));
        const nextDeleted = state.deleted.includes(type as string)
          ? state.deleted
          : [...state.deleted, type as string];
        persist(STORAGE_KEY, nextHidden);
        if (nextDeleted !== state.deleted) persist(DELETED_KEY, nextDeleted);
        return { hidden: nextHidden, deleted: nextDeleted };
      }),
    undelete: (type) =>
      set((state) => {
        const next = state.deleted.filter((t) => t !== (type as string));
        persist(DELETED_KEY, next);
        return { deleted: next };
      }),
    restoreAll: () => {
      persist(STORAGE_KEY, []);
      persist(DELETED_KEY, []);
      set({ hidden: [], deleted: [] });
    },
  })
);
