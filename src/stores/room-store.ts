import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Equipment, EquipmentCatalogEntry, EquipmentType, Position, Room } from '@/types/room';
import { DEFAULT_ROOM, EQUIPMENT_CATALOG } from '@/constants/room-defaults';
import { findCustomEntry } from '@/stores/custom-equipment-store';
import { polygonBoundingBox } from '@/utils/geometry';

/** Find an entry in the built-in catalog or user-defined custom catalog. */
function findEntry(type: EquipmentType): EquipmentCatalogEntry | undefined {
  return (
    EQUIPMENT_CATALOG.find((e) => e.type === type) ?? findCustomEntry(type)
  );
}

interface RoomState {
  room: Room;

  addEquipment: (type: EquipmentType) => void;
  addEquipmentAt: (type: EquipmentType, position: Position, rotation?: number, label?: string) => void;
  removeEquipment: (id: string) => void;
  moveEquipment: (id: string, position: Position) => void;
  rotateEquipment: (id: string, angle: number) => void;
  toggleLock: (id: string) => void;
  setRoomDimensions: (width: number, height: number) => void;
  setRoomPolygon: (polygon: Position[] | null) => void;
  /** Replace a single vertex during contour editing (no normalization). */
  updatePolygonVertex: (index: number, position: Position) => void;
  /** Insert a new vertex at `index` (shifts subsequent vertices). */
  insertPolygonVertex: (index: number, position: Position) => void;
  /** Remove vertex at `index`. No-op if fewer than 4 vertices remain. */
  removePolygonVertex: (index: number) => void;
  /** Convert the current rectangular room into a 4-vertex polygon. */
  convertRectToPolygon: () => void;
  /** Recompute bbox, shift polygon + equipment so the room starts at (0,0). */
  normalizeRoom: () => void;
  setBackgroundImage: (dataUrl: string | undefined, opacity?: number) => void;
  setBackgroundOpacity: (opacity: number) => void;
  replaceRoom: (room: Room) => void;
  clearEquipment: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: { ...DEFAULT_ROOM },

  addEquipment: (type) =>
    set((state) => {
      const catalog = findEntry(type);
      if (!catalog) return state;

      const newItem: Equipment = {
        id: uuidv4(),
        type: catalog.type,
        label: catalog.label,
        position: {
          x: state.room.width / 2 - catalog.dimensions.width / 2,
          y: state.room.height / 2 - catalog.dimensions.height / 2,
        },
        rotation: 0,
        dimensions: { ...catalog.dimensions },
        isLocked: false,
        color: catalog.color,
        zIndex: state.room.equipment.length,
        shape: catalog.shape,
      };

      return {
        room: {
          ...state.room,
          equipment: [...state.room.equipment, newItem],
        },
      };
    }),

  addEquipmentAt: (type, position, rotation = 0, label) =>
    set((state) => {
      const catalog = findEntry(type);
      if (!catalog) return state;

      const newItem: Equipment = {
        id: uuidv4(),
        type: catalog.type,
        label: label ?? catalog.label,
        position,
        rotation,
        dimensions: { ...catalog.dimensions },
        isLocked: false,
        color: catalog.color,
        zIndex: state.room.equipment.length,
        shape: catalog.shape,
      };

      return {
        room: {
          ...state.room,
          equipment: [...state.room.equipment, newItem],
        },
      };
    }),

  removeEquipment: (id) =>
    set((state) => ({
      room: {
        ...state.room,
        equipment: state.room.equipment.filter((e) => e.id !== id),
      },
    })),

  moveEquipment: (id, position) =>
    set((state) => ({
      room: {
        ...state.room,
        equipment: state.room.equipment.map((e) =>
          e.id === id ? { ...e, position } : e
        ),
      },
    })),

  rotateEquipment: (id, angle) =>
    set((state) => ({
      room: {
        ...state.room,
        equipment: state.room.equipment.map((e) =>
          e.id === id ? { ...e, rotation: angle % 360 } : e
        ),
      },
    })),

  toggleLock: (id) =>
    set((state) => ({
      room: {
        ...state.room,
        equipment: state.room.equipment.map((e) =>
          e.id === id ? { ...e, isLocked: !e.isLocked } : e
        ),
      },
    })),

  setRoomDimensions: (width, height) =>
    set((state) => ({
      room: { ...state.room, width, height },
    })),

  setRoomPolygon: (polygon) =>
    set((state) => {
      if (!polygon || polygon.length < 3) {
        return {
          room: { ...state.room, shape: 'rectangular', polygon: undefined },
        };
      }
      const bbox = polygonBoundingBox(polygon);
      // Normalize so polygon starts at (0, 0)
      const normalized = polygon.map((p) => ({
        x: p.x - bbox.minX,
        y: p.y - bbox.minY,
      }));
      return {
        room: {
          ...state.room,
          shape: 'polygon',
          polygon: normalized,
          width: bbox.maxX - bbox.minX,
          height: bbox.maxY - bbox.minY,
        },
      };
    }),

  updatePolygonVertex: (index, position) =>
    set((state) => {
      if (state.room.shape !== 'polygon' || !state.room.polygon) return state;
      const polygon = state.room.polygon.map((p, i) => (i === index ? position : p));
      const bbox = polygonBoundingBox(polygon);
      return {
        room: {
          ...state.room,
          polygon,
          // Keep bbox in sync so the view and grid stay usable mid-drag. We
          // intentionally do NOT shift vertices/equipment here -- that would
          // cause the vertex to "run away" from the user's cursor during drag.
          width: Math.max(bbox.maxX, 1) - Math.min(bbox.minX, 0),
          height: Math.max(bbox.maxY, 1) - Math.min(bbox.minY, 0),
        },
      };
    }),

  insertPolygonVertex: (index, position) =>
    set((state) => {
      if (state.room.shape !== 'polygon' || !state.room.polygon) return state;
      const polygon = [...state.room.polygon];
      polygon.splice(index, 0, position);
      return { room: { ...state.room, polygon } };
    }),

  removePolygonVertex: (index) =>
    set((state) => {
      if (state.room.shape !== 'polygon' || !state.room.polygon) return state;
      if (state.room.polygon.length <= 3) return state;
      const polygon = state.room.polygon.filter((_, i) => i !== index);
      return { room: { ...state.room, polygon } };
    }),

  convertRectToPolygon: () =>
    set((state) => {
      if (state.room.shape === 'polygon' && state.room.polygon) return state;
      const { width, height } = state.room;
      const polygon: Position[] = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height },
      ];
      return { room: { ...state.room, shape: 'polygon', polygon } };
    }),

  normalizeRoom: () =>
    set((state) => {
      if (state.room.shape !== 'polygon' || !state.room.polygon) return state;
      const bbox = polygonBoundingBox(state.room.polygon);
      const dx = -bbox.minX;
      const dy = -bbox.minY;
      const polygon = state.room.polygon.map((p) => ({ x: p.x + dx, y: p.y + dy }));
      const equipment = state.room.equipment.map((e) => ({
        ...e,
        position: { x: e.position.x + dx, y: e.position.y + dy },
      }));
      return {
        room: {
          ...state.room,
          polygon,
          equipment,
          width: bbox.maxX - bbox.minX,
          height: bbox.maxY - bbox.minY,
        },
      };
    }),

  setBackgroundImage: (dataUrl, opacity = 0.35) =>
    set((state) => ({
      room: {
        ...state.room,
        backgroundImage: dataUrl,
        backgroundOpacity: opacity,
      },
    })),

  setBackgroundOpacity: (opacity) =>
    set((state) => ({
      room: { ...state.room, backgroundOpacity: opacity },
    })),

  replaceRoom: (room) => set({ room }),

  clearEquipment: () =>
    set((state) => ({ room: { ...state.room, equipment: [] } })),
}));
