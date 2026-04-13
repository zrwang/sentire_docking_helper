import { create } from 'zustand';
import type { EquipmentType } from '@/types/room';

export type ContextMenuState =
  | { kind: 'equipment'; id: string; x: number; y: number }
  | { kind: 'type'; type: EquipmentType; x: number; y: number }
  | null;

interface ContextMenuStoreState {
  menu: ContextMenuState;
  openEquipmentMenu: (id: string, x: number, y: number) => void;
  openTypeMenu: (type: EquipmentType, x: number, y: number) => void;
  close: () => void;
}

/**
 * Lightweight right-click context menu controller. Exactly one menu is
 * visible at a time; clicking outside or pressing Escape closes it.
 */
export const useContextMenuStore = create<ContextMenuStoreState>((set) => ({
  menu: null,
  openEquipmentMenu: (id, x, y) => set({ menu: { kind: 'equipment', id, x, y } }),
  openTypeMenu: (type, x, y) => set({ menu: { kind: 'type', type, x, y } }),
  close: () => set({ menu: null }),
}));
