import type { Position, Dimensions, Room } from '@/types/room';
import { pointInPolygon } from './geometry';

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPosition(pos: Position, gridSize: number): Position {
  return {
    x: snapToGrid(pos.x, gridSize),
    y: snapToGrid(pos.y, gridSize),
  };
}

/**
 * Constrain a position so the given item remains within the room.
 * For rectangular rooms, clamps to bounding box.
 * For polygonal rooms, clamps to bounding box AND ensures the item's
 * center stays inside the polygon (approximation: we check the center
 * rather than all corners so the user can drag near edges).
 */
export function constrainToRoom(
  position: Position,
  itemDimensions: Dimensions,
  room: Room
): Position {
  // Always clamp to overall bounding box first
  let x = Math.max(0, Math.min(position.x, room.width - itemDimensions.width));
  let y = Math.max(0, Math.min(position.y, room.height - itemDimensions.height));

  if (room.shape === 'polygon' && room.polygon && room.polygon.length >= 3) {
    const cx = x + itemDimensions.width / 2;
    const cy = y + itemDimensions.height / 2;
    if (!pointInPolygon({ x: cx, y: cy }, room.polygon)) {
      // Find nearest vertex (simple fallback) rather than rejecting the drag
      // so UX doesn't feel stuck. User is free to drag back.
      let nearest = room.polygon[0];
      let minDist = Infinity;
      for (const v of room.polygon) {
        const d = (v.x - cx) ** 2 + (v.y - cy) ** 2;
        if (d < minDist) {
          minDist = d;
          nearest = v;
        }
      }
      // Pull the center a bit inside by offsetting toward the centroid
      const centroid = polygonCentroid(room.polygon);
      const dx = centroid.x - nearest.x;
      const dy = centroid.y - nearest.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const pullStrength = 20; // cm nudge toward center
      x = nearest.x + (dx / len) * pullStrength - itemDimensions.width / 2;
      y = nearest.y + (dy / len) * pullStrength - itemDimensions.height / 2;
    }
  }

  return { x, y };
}

function polygonCentroid(polygon: Position[]): Position {
  let sx = 0;
  let sy = 0;
  for (const p of polygon) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / polygon.length, y: sy / polygon.length };
}
