import { create } from 'zustand';

export type TabId = 'room' | 'robot' | 'ports';

interface AppState {
  activeTab: TabId;
  selectedEquipmentId: string | null;
  snapEnabled: boolean;
  gridVisible: boolean;
  /** When true, the canvas shows draggable vertex handles for editing the OR contour. */
  contourEditMode: boolean;
  /** Id of the equipment whose outline is being edited, or null. */
  itemContourEditId: string | null;

  setActiveTab: (tab: TabId) => void;
  selectEquipment: (id: string | null) => void;
  toggleSnap: () => void;
  toggleGrid: () => void;
  setContourEditMode: (on: boolean) => void;
  setItemContourEditId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'room',
  selectedEquipmentId: null,
  snapEnabled: true,
  gridVisible: true,
  contourEditMode: false,
  itemContourEditId: null,

  setActiveTab: (tab) => set({ activeTab: tab, selectedEquipmentId: null, contourEditMode: false, itemContourEditId: null }),
  selectEquipment: (id) => set({ selectedEquipmentId: id }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
  setContourEditMode: (on) =>
    set((s) => ({
      contourEditMode: on,
      selectedEquipmentId: on ? null : s.selectedEquipmentId,
      itemContourEditId: on ? null : s.itemContourEditId,
    })),
  setItemContourEditId: (id) => set({ itemContourEditId: id }),
}));
