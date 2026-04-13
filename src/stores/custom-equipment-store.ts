import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { EquipmentCatalogEntry } from '@/types/room';

const STORAGE_KEY = 'sentire.customEquipment.v1';

export interface CustomEquipmentEntry extends EquipmentCatalogEntry {
  /** Stable id matching the `type` field -- always `custom:<uuid>`. */
  id: string;
}

function load(): CustomEquipmentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomEquipmentEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(entries: CustomEquipmentEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded or private mode -- ignore
  }
}

interface CustomEquipmentState {
  entries: CustomEquipmentEntry[];
  /** Create a new custom entry and return the generated type string. */
  addEntry: (spec: Omit<CustomEquipmentEntry, 'id' | 'type'>) => string;
  updateEntry: (
    id: string,
    patch: Partial<Omit<CustomEquipmentEntry, 'id' | 'type'>>
  ) => void;
  removeEntry: (id: string) => void;
}

export const useCustomEquipmentStore = create<CustomEquipmentState>((set) => ({
  entries: load(),

  addEntry: (spec) => {
    const id = `custom:${uuidv4()}`;
    const entry: CustomEquipmentEntry = { ...spec, id, type: id };
    set((state) => {
      const next = [...state.entries, entry];
      persist(next);
      return { entries: next };
    });
    return id;
  },

  updateEntry: (id, patch) =>
    set((state) => {
      const next = state.entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
      persist(next);
      return { entries: next };
    }),

  removeEntry: (id) =>
    set((state) => {
      const next = state.entries.filter((e) => e.id !== id);
      persist(next);
      return { entries: next };
    }),
}));

/**
 * Look up a catalog entry (built-in or custom) by its type string. Returns
 * `undefined` if no match exists.
 */
export function findCustomEntry(type: string): CustomEquipmentEntry | undefined {
  return useCustomEquipmentStore.getState().entries.find((e) => e.type === type);
}
