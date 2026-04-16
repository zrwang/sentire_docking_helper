import { Rect, Text, Line } from 'react-konva';
import type { Room } from '@/types/room';
import { polygonToKonvaPoints } from '@/utils/geometry';

interface RoomWallsProps {
  room: Room;
}

export function RoomWalls({ room }: RoomWallsProps) {
  const { width, height, shape, polygon } = room;

  if (shape === 'polygon' && polygon && polygon.length >= 3) {
    const points = polygonToKonvaPoints(polygon);
    return (
      <>
        {/* Polygon floor fill */}
        <Line
          points={points}
          closed
          fill="#111827"
          listening={false}
        />
        {/* Polygon wall stroke */}
        <Line
          points={points}
          closed
          stroke="#4B5563"
          strokeWidth={4}
          listening={false}
        />
        {/* Dimension labels */}
        <Text
          x={width / 2 - 40}
          y={-25}
          text={`${Math.round(width)} cm`}
          fontSize={14}
          fill="#9CA3AF"
          listening={false}
        />
        <Text
          x={-55}
          y={height / 2 - 7}
          text={`${Math.round(height)} cm`}
          fontSize={14}
          fill="#9CA3AF"
          rotation={-90}
          listening={false}
        />
      </>
    );
  }

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#111827"
        listening={false}
      />
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        stroke="#4B5563"
        strokeWidth={4}
        listening={false}
      />
      <Text
        x={width / 2 - 40}
        y={-25}
        text={`${Math.round(width)} cm`}
        fontSize={14}
        fill="#9CA3AF"
        listening={false}
      />
      <Text
        x={-50}
        y={height / 2 - 7}
        text={`${Math.round(height)} cm`}
        fontSize={14}
        fill="#9CA3AF"
        rotation={-90}
        listening={false}
      />
    </>
  );
}
