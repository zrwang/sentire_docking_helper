import { create } from 'zustand';
import type { EquipmentType } from '@/types/room';

const STORAGE_KEY = 'sentire.typeIcons.v1';

function loadIcons(): Partial<Record<EquipmentType, string>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<EquipmentType, string>>) : {};
  } catch {
    return {};
  }
}

function persist(icons: Partial<Record<EquipmentType, string>>): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
    return true;
  } catch (err) {
    // Most often QuotaExceededError -- the data URLs were too big. Surface it
    // so callers can warn the user; the in-memory state is still updated so
    // the current session works, but the icon won't survive a reload.
    console.error('[icon-store] Failed to persist icons:', err);
    return false;
  }
}

interface IconState {
  /** Custom image (data URL) used to render an equipment type in place of the default coloured shape. */
  icons: Partial<Record<EquipmentType, string>>;
  /**
   * Set an icon. Returns true if it was successfully persisted to localStorage,
   * false if the write failed (typically because the data URL is too large).
   */
  setIcon: (type: EquipmentType, dataUrl: string) => boolean;
  clearIcon: (type: EquipmentType) => void;
}

export const useIconStore = create<IconState>((set) => ({
  icons: loadIcons(),
  setIcon: (type, dataUrl) => {
    let ok = false;
    set((state) => {
      const next = { ...state.icons, [type]: dataUrl };
      ok = persist(next);
      return { icons: next };
    });
    return ok;
  },
  clearIcon: (type) =>
    set((state) => {
      const next = { ...state.icons };
      delete next[type];
      persist(next);
      return { icons: next };
    }),
}));
