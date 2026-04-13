export interface Position {
  x: number; // centimeters from room origin
  y: number;
}

export interface Dimensions {
  width: number;  // cm
  height: number; // cm
}

export type EquipmentType =
  | 'operating-table'
  | 'patient-cart'           // da Vinci X Patient Side Robot (PSR) -- legacy
  | 'patient-cart-3arm'      // PSR: 3-arm configuration
  | 'patient-cart-4arm-left' // PSR: 4-arm configuration, left docking
  | 'patient-cart-4arm-right'// PSR: 4-arm configuration, right docking
  | 'patient-cart-backup'    // Backup PSR
  | 'surgeon-console'
  | 'vision-cart'
  | 'anesthesia-station'
  | 'anesthetic-trolley'
  | 'instrument-table'
  | 'scrub-table'
  | 'monitor'
  | 'pendant'
  | 'pendant-screen'
  | 'external-screen'
  | 'mayo-stand'
  | 'back-table'
  | 'supply-cart'
  | 'trolley'
  | 'ultrasound-machine'
  | 'insufflator-cart'
  | 'swab-rack'
  | 'medical-fridge'
  | 'observation-station'
  | 'generic'
  // User-defined custom entries use a `custom:<uuid>` string. Keeping the
  // literal union plus `(string & {})` preserves autocomplete for known
  // values while allowing arbitrary custom ids.
  | (string & {});

export interface EquipmentCatalogEntry {
  type: EquipmentType;
  label: string;
  dimensions: Dimensions;
  color: string;
  shape?: 'rect' | 'circle';
  /**
   * Optional default polygon outline baked into the catalog entry. Used by
   * specialized variants (e.g. the PSR arm configurations) whose distinctive
   * shape should be visible even before the user customizes it.
   */
  polygon?: Position[];
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  label: string;
  position: Position;       // top-left in room coordinates (cm)
  rotation: number;         // degrees
  dimensions: Dimensions;
  isLocked: boolean;
  color: string;
  zIndex: number;
  shape?: 'rect' | 'circle';
  /**
   * Optional custom polygon outline (local coords, origin at item's top-left,
   * values in 0..dimensions.width x 0..dimensions.height). When present, the
   * item renders as this polygon instead of its default rect/circle shape.
   */
  polygon?: Position[];
}

export type RoomShapeType = 'rectangular' | 'polygon';

export interface Room {
  shape: RoomShapeType;
  width: number;            // cm - bounding box width
  height: number;           // cm - bounding box height
  gridSize: number;         // cm
  /** Polygon vertices in cm. Only used when shape === 'polygon'. */
  polygon?: Position[];
  equipment: Equipment[];
  /** Optional background image (data URL) shown behind the floor plan */
  backgroundImage?: string;
  /** Opacity for the background image 0..1 */
  backgroundOpacity?: number;
  /**
   * Optional transform for the background image (in cm, room-space). When
   * absent, the image fills (0, 0) → (room.width, room.height) -- legacy
   * behavior. When present, the image is drawn at this position / size so
   * the user can nudge and scale a traced reference freehand.
   */
  backgroundX?: number;
  backgroundY?: number;
  backgroundWidth?: number;
  backgroundHeight?: number;
}
