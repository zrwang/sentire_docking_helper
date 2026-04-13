import { create } from 'zustand';

export type TabId = 'room' | 'robot' | 'ports';

/**
 * Returns a data URL snapshot of the canvas, or null if the canvas isn't
 * ready. Lives as a callback in the store so non-child components
 * (e.g. AppHeader's Export button) can trigger exports without having to
 * plumb a stage ref through the tree.
 */
export type CanvasExporter = (opts: {
  mimeType: 'image/png' | 'image/jpeg';
  quality?: number;
}) => string | null;

interface AppState {
  activeTab: TabId;
  selectedEquipmentId: string | null;
  snapEnabled: boolean;
  gridVisible: boolean;
  /** When true, the canvas shows draggable vertex handles for editing the OR contour. */
  contourEditMode: boolean;
  /** Id of the equipment whose outline is being edited, or null. */
  itemContourEditId: string | null;
  /**
   * When true, width/height edits on the selected equipment (both via the
   * properties panel and the on-canvas drag handle) stay locked to the
   * item's current aspect ratio. Mirrors what holding Shift does during a
   * drag, but persists across interactions.
   */
  aspectLocked: boolean;
  /** When true, the canvas exposes drag/resize handles for the background image. */
  bgAdjustMode: boolean;
  /**
   * Registered by RoomCanvas on mount; lets any component (AppHeader) ask the
   * stage to produce a PNG/JPEG snapshot.
   */
  canvasExporter: CanvasExporter | null;

  setActiveTab: (tab: TabId) => void;
  selectEquipment: (id: string | null) => void;
  toggleSnap: () => void;
  toggleGrid: () => void;
  setContourEditMode: (on: boolean) => void;
  setItemContourEditId: (id: string | null) => void;
  toggleAspectLocked: () => void;
  setAspectLocked: (on: boolean) => void;
  setBgAdjustMode: (on: boolean) => void;
  setCanvasExporter: (fn: CanvasExporter | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'room',
  selectedEquipmentId: null,
  snapEnabled: true,
  gridVisible: true,
  contourEditMode: false,
  itemContourEditId: null,
  aspectLocked: false,
  bgAdjustMode: false,
  canvasExporter: null,

  setActiveTab: (tab) => set({ activeTab: tab, selectedEquipmentId: null, contourEditMode: false, itemContourEditId: null, bgAdjustMode: false }),
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
  toggleAspectLocked: () => set((s) => ({ aspectLocked: !s.aspectLocked })),
  setAspectLocked: (on) => set({ aspectLocked: on }),
  setBgAdjustMode: (on) =>
    set((s) => ({
      bgAdjustMode: on,
      // Deselecting while entering adjust mode keeps clicks on the canvas
      // from fighting with equipment selection handles.
      selectedEquipmentId: on ? null : s.selectedEquipmentId,
    })),
  setCanvasExporter: (fn) => set({ canvasExporter: fn }),
}));
