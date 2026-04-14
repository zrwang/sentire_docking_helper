import type { EquipmentCatalogEntry, Position } from '@/types/room';

/**
 * Patient Side Robot (Sentire C1000) configurations. Each config has a distinct
 * footprint so the three arm arrangements are visually distinguishable on the
 * canvas even without uploading a custom icon. Users can still override the
 * size, outline, and icon per config via the right-click menu.
 *
 * Polygons are traced clockwise from the top-left corner. All coordinates
 * are in centimeters, local to the item's top-left origin.
 */

const THREE_ARM_POLYGON: Position[] = [
  // Base strip across the top
  { x: 0, y: 0 }, { x: 80, y: 0 }, { x: 80, y: 30 },
  // Right arm
  { x: 65, y: 30 }, { x: 65, y: 80 }, { x: 55, y: 80 }, { x: 55, y: 30 },
  // Middle arm
  { x: 47, y: 30 }, { x: 47, y: 80 }, { x: 37, y: 80 }, { x: 37, y: 30 },
  // Left arm
  { x: 25, y: 30 }, { x: 25, y: 80 }, { x: 15, y: 80 }, { x: 15, y: 30 },
  { x: 0, y: 30 },
];

const FOUR_ARM_LEFT_POLYGON: Position[] = [
  // Base strip; arms are packed into the LEFT ~75% of the footprint
  { x: 0, y: 0 }, { x: 110, y: 0 }, { x: 110, y: 30 },
  // Empty right shoulder (no arm there)
  { x: 75, y: 30 }, { x: 75, y: 80 }, { x: 65, y: 80 }, { x: 65, y: 30 },
  { x: 55, y: 30 }, { x: 55, y: 80 }, { x: 45, y: 80 }, { x: 45, y: 30 },
  { x: 35, y: 30 }, { x: 35, y: 80 }, { x: 25, y: 80 }, { x: 25, y: 30 },
  { x: 15, y: 30 }, { x: 15, y: 80 }, { x: 5, y: 80 }, { x: 5, y: 30 },
  { x: 0, y: 30 },
];

const FOUR_ARM_RIGHT_POLYGON: Position[] = [
  // Base strip; arms are packed into the RIGHT ~75% of the footprint
  { x: 0, y: 0 }, { x: 110, y: 0 }, { x: 110, y: 30 },
  { x: 105, y: 30 }, { x: 105, y: 80 }, { x: 95, y: 80 }, { x: 95, y: 30 },
  { x: 85, y: 30 }, { x: 85, y: 80 }, { x: 75, y: 80 }, { x: 75, y: 30 },
  { x: 65, y: 30 }, { x: 65, y: 80 }, { x: 55, y: 80 }, { x: 55, y: 30 },
  { x: 45, y: 30 }, { x: 45, y: 80 }, { x: 35, y: 80 }, { x: 35, y: 30 },
  // Empty left shoulder (no arm there)
  { x: 0, y: 30 },
];

export interface PsrConfig extends EquipmentCatalogEntry {
  /** Short label for compact UI (e.g. palette variant buttons). */
  shortLabel: string;
  /** Sentence used in tooltips and the config switcher. */
  description: string;
}

export const PSR_CONFIGS: PsrConfig[] = [
  {
    type: 'patient-cart-3arm',
    label: 'PSR (3-arm)',
    shortLabel: '3-arm',
    description: 'Three-arm patient side robot — compact footprint.',
    dimensions: { width: 80, height: 80 },
    color: '#60A5FA',
    polygon: THREE_ARM_POLYGON,
  },
  {
    type: 'patient-cart-4arm-left',
    label: 'PSR (4-arm, left)',
    shortLabel: '4-arm L',
    description: 'Four-arm patient side robot, left-side configuration.',
    dimensions: { width: 110, height: 80 },
    color: '#3B82F6',
    polygon: FOUR_ARM_LEFT_POLYGON,
  },
  {
    type: 'patient-cart-4arm-right',
    label: 'PSR (4-arm, right)',
    shortLabel: '4-arm R',
    description: 'Four-arm patient side robot, right-side configuration.',
    dimensions: { width: 110, height: 80 },
    color: '#2563EB',
    polygon: FOUR_ARM_RIGHT_POLYGON,
  },
];

/** All type strings that represent a PSR config (excludes backup). */
export const PSR_CONFIG_TYPES = PSR_CONFIGS.map((c) => c.type) as readonly string[];

export function isPsrConfigType(type: string): boolean {
  return PSR_CONFIG_TYPES.includes(type);
}

export function findPsrConfig(type: string): PsrConfig | undefined {
  return PSR_CONFIGS.find((c) => c.type === type);
}
