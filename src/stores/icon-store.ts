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

function persist(icons: Partial<Record<EquipmentType, string>>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
  } catch {
    // quota exceeded or private mode — ignore
  }
}

interface IconState {
  /** Custom image (data URL) used to render an equipment type in place of the default coloured shape. */
  icons: Partial<Record<EquipmentType, string>>;
  setIcon: (type: EquipmentType, dataUrl: string) => void;
  clearIcon: (type: EquipmentType) => void;
}

export const useIconStore = create<IconState>((set) => ({
  icons: loadIcons(),
  setIcon: (type, dataUrl) =>
    set((state) => {
      const next = { ...state.icons, [type]: dataUrl };
      persist(next);
      return { icons: next };
    }),
  clearIcon: (type) =>
    set((state) => {
      const next = { ...state.icons };
      delete next[type];
      persist(next);
      return { icons: next };
    }),
}));
