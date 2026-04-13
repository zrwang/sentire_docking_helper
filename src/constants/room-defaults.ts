import type { EquipmentCatalogEntry, Room } from '@/types/room';

export const EQUIPMENT_CATALOG: EquipmentCatalogEntry[] = [
  // --- Core surgical equipment ---
  {
    type: 'operating-table',
    label: 'Operating Table',
    dimensions: { width: 200, height: 55 },
    color: '#6B7280',
  },
  {
    type: 'patient-cart',
    label: 'Patient Side Robot',
    dimensions: { width: 100, height: 110 },
    color: '#3B82F6',
  },
  {
    type: 'patient-cart-backup',
    label: 'Patient Side Robot (backup)',
    dimensions: { width: 100, height: 110 },
    color: '#93C5FD',
  },
  {
    type: 'surgeon-console',
    label: 'Surgeon Console',
    dimensions: { width: 100, height: 90 },
    color: '#8B5CF6',
  },
  {
    type: 'vision-cart',
    label: 'Vision Cart',
    dimensions: { width: 60, height: 65 },
    color: '#10B981',
  },

  // --- Anesthesia ---
  {
    type: 'anesthesia-station',
    label: 'Anesthetic Machine',
    dimensions: { width: 90, height: 70 },
    color: '#F59E0B',
  },
  {
    type: 'anesthetic-trolley',
    label: 'Anesthetic Trolley',
    dimensions: { width: 70, height: 45 },
    color: '#FBBF24',
  },

  // --- Tables ---
  {
    type: 'instrument-table',
    label: 'Instrument Table',
    dimensions: { width: 120, height: 50 },
    color: '#EF4444',
  },
  {
    type: 'scrub-table',
    label: 'Scrub Table',
    dimensions: { width: 120, height: 50 },
    color: '#22C55E',
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

  // --- Carts ---
  {
    type: 'supply-cart',
    label: 'Supply Cart',
    dimensions: { width: 50, height: 45 },
    color: '#F97316',
  },
  {
    type: 'trolley',
    label: 'Trolley',
    dimensions: { width: 60, height: 100 },
    color: '#1F2937',
  },
  {
    type: 'insufflator-cart',
    label: 'Insufflator/Suction Cart',
    dimensions: { width: 60, height: 80 },
    color: '#A855F7',
  },

  // --- Displays ---
  {
    type: 'monitor',
    label: 'Monitor',
    dimensions: { width: 50, height: 15 },
    color: '#6366F1',
  },
  {
    type: 'pendant',
    label: 'Pendant',
    dimensions: { width: 70, height: 60 },
    color: '#64748B',
  },
  {
    type: 'pendant-screen',
    label: 'Pendant Screen',
    dimensions: { width: 60, height: 15 },
    color: '#94A3B8',
  },
  {
    type: 'external-screen',
    label: 'External Screen',
    dimensions: { width: 80, height: 15 },
    color: '#475569',
  },

  // --- Imaging / specialized ---
  {
    type: 'ultrasound-machine',
    label: 'Ultrasound Machine',
    dimensions: { width: 60, height: 60 },
    color: '#0EA5E9',
  },

  // --- Storage / misc ---
  {
    type: 'swab-rack',
    label: 'Swab Rack',
    dimensions: { width: 120, height: 30 },
    color: '#84CC16',
  },
  {
    type: 'medical-fridge',
    label: 'Medical Fridge',
    dimensions: { width: 60, height: 50 },
    color: '#D1D5DB',
  },

  // --- People / observation ---
  {
    type: 'observation-station',
    label: 'Observation Station',
    dimensions: { width: 35, height: 35 },
    color: '#9CA3AF',
    shape: 'circle',
  },

  // --- Catch-all ---
  {
    type: 'generic',
    label: 'Custom Item',
    dimensions: { width: 60, height: 60 },
    color: '#71717A',
  },
];

export const DEFAULT_ROOM: Room = {
  shape: 'rectangular',
  width: 775,    // ~25.4 ft, standard OR
  height: 775,
  gridSize: 10,  // 10cm grid
  equipment: [],
};

export const MIN_ROOM_SIZE = 300;  // cm
export const MAX_ROOM_SIZE = 1500; // cm
