import type { Position, Equipment } from '@/types/room';

export function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function rotatePoint(
  point: Position,
  center: Position,
  angleDeg: number
): Position {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function getEquipmentCenter(eq: Equipment): Position {
  return {
    x: eq.position.x + eq.dimensions.width / 2,
    y: eq.position.y + eq.dimensions.height / 2,
  };
}

export function getRotatedRectCorners(eq: Equipment): Position[] {
  const center = getEquipmentCenter(eq);
  const hw = eq.dimensions.width / 2;
  const hh = eq.dimensions.height / 2;

  const corners: Position[] = [
    { x: center.x - hw, y: center.y - hh },
    { x: center.x + hw, y: center.y - hh },
    { x: center.x + hw, y: center.y + hh },
    { x: center.x - hw, y: center.y + hh },
  ];

  if (eq.rotation === 0) return corners;
  return corners.map((c) => rotatePoint(c, center, eq.rotation));
}

/** Separating Axis Theorem for two convex polygons */
function getAxes(corners: Position[]): Position[] {
  const axes: Position[] = [];
  for (let i = 0; i < corners.length; i++) {
    const next = corners[(i + 1) % corners.length];
    const edge = { x: next.x - corners[i].x, y: next.y - corners[i].y };
    const len = Math.sqrt(edge.x ** 2 + edge.y ** 2);
    if (len === 0) continue;
    axes.push({ x: -edge.y / len, y: edge.x / len });
  }
  return axes;
}

function projectPolygon(
  corners: Position[],
  axis: Position
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const c of corners) {
    const proj = c.x * axis.x + c.y * axis.y;
    if (proj < min) min = proj;
    if (proj > max) max = proj;
  }
  return { min, max };
}

export function polygonsOverlap(a: Position[], b: Position[]): boolean {
  const axes = [...getAxes(a), ...getAxes(b)];
  for (const axis of axes) {
    const projA = projectPolygon(a, axis);
    const projB = projectPolygon(b, axis);
    if (projA.max <= projB.min || projB.max <= projA.min) {
      return false;
    }
  }
  return true;
}

/** Ray-casting point-in-polygon test. */
export function pointInPolygon(point: Position, polygon: Position[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Axis-aligned bounding box of a polygon. */
export function polygonBoundingBox(polygon: Position[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/** Convert a polygon to a flat points array for Konva's Line component. */
export function polygonToKonvaPoints(polygon: Position[]): number[] {
  const pts: number[] = [];
  for (const p of polygon) {
    pts.push(p.x, p.y);
  }
  return pts;
}
