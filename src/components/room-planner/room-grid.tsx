import type { ReactElement } from 'react';
import { Line } from 'react-konva';

interface RoomGridProps {
  width: number;
  height: number;
  gridSize: number;
  visible: boolean;
}

export function RoomGrid({ width, height, gridSize, visible }: RoomGridProps) {
  if (!visible) return null;

  const lines: ReactElement[] = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    const isMajor = x % (gridSize * 10) === 0;
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={isMajor ? '#374151' : '#1f2937'}
        strokeWidth={isMajor ? 0.5 : 0.25}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    const isMajor = y % (gridSize * 10) === 0;
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={isMajor ? '#374151' : '#1f2937'}
        strokeWidth={isMajor ? 0.5 : 0.25}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}
