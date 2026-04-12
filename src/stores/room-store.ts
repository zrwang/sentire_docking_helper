import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Equipment, EquipmentType, Position, Room } from '@/types/room';
import { DEFAULT_ROOM, EQUIPMENT_CATALOG } from '@/constants/room-defaults';

interface RoomState {
  room: Room;

  addEquipment: (type: EquipmentType) => void;
  removeEquipment: (id: string) => void;
  moveEquipment: (id: string, position: Position) => void;
  rotateEquipment: (id: string, angle: number) => void;
  toggleLock: (id: string) => void;
  setRoomDimensions: (width: number, height: number) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: { ...DEFAULT_ROOM },

  addEquipment: (type) =>
    set((state) => {
      const catalog = EQUIPMENT_CATALOG.find((e) => e.type === type);
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
}));
