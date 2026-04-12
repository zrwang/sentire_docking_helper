import { create } from 'zustand';

export type TabId = 'room' | 'robot' | 'ports';

interface AppState {
  activeTab: TabId;
  selectedEquipmentId: string | null;
  snapEnabled: boolean;
  gridVisible: boolean;

  setActiveTab: (tab: TabId) => void;
  selectEquipment: (id: string | null) => void;
  toggleSnap: () => void;
  toggleGrid: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'room',
  selectedEquipmentId: null,
  snapEnabled: true,
  gridVisible: true,

  setActiveTab: (tab) => set({ activeTab: tab, selectedEquipmentId: null }),
  selectEquipment: (id) => set({ selectedEquipmentId: id }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
}));
