import type { Position, Dimensions } from '@/types/room';

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPosition(pos: Position, gridSize: number): Position {
  return {
    x: snapToGrid(pos.x, gridSize),
    y: snapToGrid(pos.y, gridSize),
  };
}

export function constrainToRoom(
  position: Position,
  itemDimensions: Dimensions,
  roomWidth: number,
  roomHeight: number
): Position {
  return {
    x: Math.max(0, Math.min(position.x, roomWidth - itemDimensions.width)),
    y: Math.max(0, Math.min(position.y, roomHeight - itemDimensions.height)),
  };
}
