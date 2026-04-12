import type { EquipmentCatalogEntry, Room } from '@/types/room';

export const EQUIPMENT_CATALOG: EquipmentCatalogEntry[] = [
  {
    type: 'operating-table',
    label: 'Operating Table',
    dimensions: { width: 200, height: 55 },
    color: '#6B7280',
  },
  {
    type: 'patient-cart',
    label: 'Patient Cart (da Vinci X)',
    dimensions: { width: 90, height: 90 },
    color: '#3B82F6',
  },
  {
    type: 'surgeon-console',
    label: 'Surgeon Console',
    dimensions: { width: 70, height: 80 },
    color: '#8B5CF6',
  },
  {
    type: 'vision-cart',
    label: 'Vision Cart',
    dimensions: { width: 60, height: 65 },
    color: '#10B981',
  },
  {
    type: 'anesthesia-station',
    label: 'Anesthesia Station',
    dimensions: { width: 80, height: 65 },
    color: '#F59E0B',
  },
  {
    type: 'instrument-table',
    label: 'Instrument Table',
    dimensions: { width: 120, height: 50 },
    color: '#EF4444',
  },
  {
    type: 'monitor',
    label: 'Monitor',
    dimensions: { width: 50, height: 15 },
    color: '#6366F1',
  },
  {
    type: 'mayo-stand',
    label: 'Mayo Stand',
    dimensions: { width: 45, height: 35 },
    color: '#EC4899',
  },
  {
    type: 'back-table',
    label: 'Back Table',
    dimensions: { width: 150, height: 60 },
    color: '#14B8A6',
  },
  {
    type: 'supply-cart',
    label: 'Supply Cart',
    dimensions: { width: 50, height: 45 },
    color: '#F97316',
  },
];

export const DEFAULT_ROOM: Room = {
  width: 775,    // ~25.4 ft, standard OR
  height: 775,
  gridSize: 10,  // 10cm grid
  equipment: [],
};

export const MIN_ROOM_SIZE = 300;  // cm
export const MAX_ROOM_SIZE = 1500; // cm
