import { useCallback } from 'react';
import type { Dimensions } from '@/types/room';
import { snapToGrid } from '@/utils/snap';

interface UseDragConstraintsOptions {
  itemDimensions: Dimensions;
  roomWidth: number;
  roomHeight: number;
  gridSize: number;
  snapEnabled: boolean;
  scale: number;
}

export function useDragConstraints({
  itemDimensions,
  roomWidth,
  roomHeight,
  gridSize,
  snapEnabled,
  scale,
}: UseDragConstraintsOptions) {
  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => {
      let x = pos.x / scale;
      let y = pos.y / scale;

      if (snapEnabled) {
        x = snapToGrid(x, gridSize);
        y = snapToGrid(y, gridSize);
      }

      // Constrain to room bounds
      x = Math.max(0, Math.min(x, roomWidth - itemDimensions.width));
      y = Math.max(0, Math.min(y, roomHeight - itemDimensions.height));

      return { x: x * scale, y: y * scale };
    },
    [itemDimensions, roomWidth, roomHeight, gridSize, snapEnabled, scale]
  );

  return { dragBoundFunc };
}
