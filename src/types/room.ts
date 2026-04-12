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
  | 'patient-cart'
  | 'surgeon-console'
  | 'vision-cart'
  | 'anesthesia-station'
  | 'instrument-table'
  | 'monitor'
  | 'mayo-stand'
  | 'back-table'
  | 'supply-cart';

export interface EquipmentCatalogEntry {
  type: EquipmentType;
  label: string;
  dimensions: Dimensions;
  color: string;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  label: string;
  position: Position;
  rotation: number; // degrees
  dimensions: Dimensions;
  isLocked: boolean;
  color: string;
  zIndex: number;
}

export interface Room {
  width: number;    // cm
  height: number;   // cm
  gridSize: number; // cm
  equipment: Equipment[];
}
