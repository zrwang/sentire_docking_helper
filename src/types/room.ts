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
  | 'patient-cart'           // da Vinci X Patient Side Robot (PSR)
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
  | 'generic';

export interface EquipmentCatalogEntry {
  type: EquipmentType;
  label: string;
  dimensions: Dimensions;
  color: string;
  shape?: 'rect' | 'circle';
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
}
