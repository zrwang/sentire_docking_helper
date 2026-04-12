import type { Equipment } from '@/types/room';
import { getRotatedRectCorners, polygonsOverlap } from './geometry';

/**
 * Check if a given equipment item overlaps with any other items.
 * Returns the IDs of all items it overlaps with.
 */
export function getOverlappingItems(
  item: Equipment,
  allItems: Equipment[]
): string[] {
  const itemCorners = getRotatedRectCorners(item);
  const overlapping: string[] = [];

  for (const other of allItems) {
    if (other.id === item.id) continue;
    const otherCorners = getRotatedRectCorners(other);
    if (polygonsOverlap(itemCorners, otherCorners)) {
      overlapping.push(other.id);
    }
  }

  return overlapping;
}
