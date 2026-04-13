import { v4 as uuidv4 } from 'uuid';
import type { Equipment, EquipmentType, Room } from '@/types/room';
import { EQUIPMENT_CATALOG } from '@/constants/room-defaults';

/**
 * Minimal spec for a preset item. Dimensions/color/shape come from the catalog
 * so changing catalog values automatically flows through to every preset.
 */
interface PresetItem {
  type: EquipmentType;
  label?: string;
  /** Top-left corner in cm. */
  position: { x: number; y: number };
  rotation?: number;
  /** Override catalog dimensions for this specific item. */
  dimensions?: { width: number; height: number };
  isLocked?: boolean;
}

function materialize(items: PresetItem[]): Equipment[] {
  return items.map((p, idx) => {
    const catalog = EQUIPMENT_CATALOG.find((c) => c.type === p.type);
    return {
      id: uuidv4(),
      type: p.type,
      label: p.label ?? catalog?.label ?? p.type,
      position: p.position,
      rotation: p.rotation ?? 0,
      dimensions: p.dimensions ?? { ...(catalog?.dimensions ?? { width: 60, height: 60 }) },
      isLocked: p.isLocked ?? false,
      color: catalog?.color ?? '#71717A',
      zIndex: idx,
      shape: catalog?.shape ?? 'rect',
    };
  });
}

/**
 * "Partial Nephrectomy (left)" preset — approximate reproduction of the
 * CUHKMC-20250807 OT layout. All coordinates are in cm; the bounding box
 * is ~1100 × 800 cm (11 × 8 m) to match the diagram's scale bar.
 *
 * Positions are eyeballed; feel free to drag/rotate anything after loading.
 */
export function createPartialNephrectomyPreset(): Room {
  const items: PresetItem[] = [
    // --- Top wall: consoles & vision cart ---
    { type: 'surgeon-console', label: 'Surgeon Console', position: { x: 270, y: 80 } },
    { type: 'vision-cart', label: 'CS', position: { x: 420, y: 80 } },
    { type: 'pendant', label: 'Pendant', position: { x: 800, y: 100 } },

    // --- Top-left and top-right dark PCs ---
    { type: 'trolley', label: 'CUM C PC', position: { x: 110, y: 80 }, dimensions: { width: 55, height: 110 } },
    { type: 'trolley', label: 'CUMC PC', position: { x: 640, y: 100 }, dimensions: { width: 60, height: 130 } },

    // --- Left wall: anesthetic trolley + anesthetic machine ---
    { type: 'anesthetic-trolley', label: 'Anesthetic Trolley', position: { x: 35, y: 120 }, rotation: 90 },
    { type: 'anesthesia-station', label: 'Anesthetic Machine', position: { x: 180, y: 330 } },

    // --- Centre: operating table + da Vinci patient carts ---
    { type: 'operating-table', label: 'Operating Table', position: { x: 430, y: 290 }, rotation: 90 },
    { type: 'patient-cart', label: 'Patient Side Robot', position: { x: 440, y: 220 } },
    {
      type: 'patient-cart-backup',
      label: 'Patient Side Robot (backup)',
      position: { x: 870, y: 230 },
      rotation: 90,
    },

    // --- Scrub tables (two, flanking the patient) ---
    { type: 'scrub-table', label: 'Scrub Table', position: { x: 430, y: 430 }, rotation: 90 },
    { type: 'scrub-table', label: 'Scrub Table', position: { x: 580, y: 430 }, rotation: 90 },

    // --- Pendant screens (three smaller displays) ---
    { type: 'pendant-screen', label: 'Pendant Screen', position: { x: 320, y: 250 } },
    { type: 'pendant-screen', label: 'Pendant Screen', position: { x: 540, y: 280 } },
    { type: 'pendant-screen', label: 'Pendant Screen', position: { x: 300, y: 300 } },

    // --- Insufflator / ultrasound along the left-bottom ---
    { type: 'insufflator-cart', label: 'Pendant (Insufflator/Suction, SDI AUX)', position: { x: 230, y: 440 } },
    { type: 'ultrasound-machine', label: 'Ultrasound Machine', position: { x: 140, y: 560 } },

    // --- Bottom row: swab rack, medical fridge, external screens ---
    { type: 'medical-fridge', label: 'Medical Fridge', position: { x: 140, y: 690 } },
    { type: 'swab-rack', label: 'Swab Rack', position: { x: 360, y: 670 } },
    { type: 'external-screen', label: 'External Screen', position: { x: 280, y: 750 } },
    { type: 'external-screen', label: 'External Screen', position: { x: 600, y: 750 } },

    // --- Observation / staff circles ---
    { type: 'observation-station', label: 'OS', position: { x: 500, y: 580 } },
    { type: 'observation-station', label: 'OS', position: { x: 560, y: 580 } },
    { type: 'observation-station', label: 'AN', position: { x: 330, y: 340 } },
    { type: 'observation-station', label: 'AS', position: { x: 500, y: 420 } },
    { type: 'observation-station', label: 'SN', position: { x: 500, y: 510 } },
    { type: 'observation-station', label: 'SN', position: { x: 560, y: 510 } },

    // --- Trolleys stack near right-bottom (patient entrance) ---
    { type: 'trolley', label: 'Trolleys', position: { x: 920, y: 490 }, rotation: 15 },
    { type: 'trolley', label: 'Trolleys', position: { x: 950, y: 610 }, rotation: 30 },
  ];

  return {
    shape: 'polygon',
    width: 1100,
    height: 800,
    gridSize: 10,
    // Octagonal OR with chamfered corners (scale bar shows ~11 x 8 m).
    polygon: [
      { x: 0, y: 150 },
      { x: 150, y: 0 },
      { x: 950, y: 0 },
      { x: 1100, y: 150 },
      { x: 1100, y: 600 },
      { x: 980, y: 720 },
      { x: 950, y: 800 },
      { x: 150, y: 800 },
      { x: 0, y: 650 },
    ],
    equipment: materialize(items),
  };
}
