import { create } from 'zustand';
import type { EquipmentType, Position } from '@/types/room';

const STORAGE_KEY = 'sentire.typeOverrides.v1';

export interface TypeOverride {
  dimensions?: { width: number; height: number };
  polygon?: Position[];
}

function load(): Record<string, TypeOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TypeOverride>) : {};
  } catch {
    return {};
  }
}

function persist(overrides: Record<string, TypeOverride>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore
  }
}

interface TypeOverridesState {
  overrides: Record<string, TypeOverride>;
  /** Upsert a dimensions override. */
  setDimensions: (type: EquipmentType, dims: { width: number; height: number }) => void;
  /** Upsert or clear a polygon override. Passing undefined removes it. */
  setPolygon: (type: EquipmentType, polygon: Position[] | undefined) => void;
  /** Remove all overrides for this type. */
  clear: (type: EquipmentType) => void;
}

export const useTypeOverridesStore = create<TypeOverridesState>((set) => ({
  overrides: load(),

  setDimensions: (type, dimensions) =>
    set((state) => {
      const prev = state.overrides[type] ?? {};
      const next = { ...state.overrides, [type]: { ...prev, dimensions } };
      persist(next);
      return { overrides: next };
    }),

  setPolygon: (type, polygon) =>
    set((state) => {
      const prev = state.overrides[type] ?? {};
      const merged: TypeOverride = { ...prev };
      if (polygon && polygon.length >= 3) merged.polygon = polygon;
      else delete merged.polygon;
      const next = { ...state.overrides };
      if (merged.dimensions || merged.polygon) next[type] = merged;
      else delete next[type];
      persist(next);
      return { overrides: next };
    }),

  clear: (type) =>
    set((state) => {
      const next = { ...state.overrides };
      delete next[type];
      persist(next);
      return { overrides: next };
    }),
}));

/** Non-hook accessor for use inside other stores. */
export function getTypeOverride(type: EquipmentType): TypeOverride | undefined {
  return useTypeOverridesStore.getState().overrides[type];
}
