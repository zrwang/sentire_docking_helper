import { Rect, Text } from 'react-konva';

interface RoomWallsProps {
  width: number;
  height: number;
}

export function RoomWalls({ width, height }: RoomWallsProps) {
  return (
    <>
      {/* Room floor background */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#111827"
        listening={false}
      />
      {/* Wall border */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        stroke="#4B5563"
        strokeWidth={4}
        listening={false}
      />
      {/* Room dimension labels */}
      <Text
        x={width / 2 - 40}
        y={-25}
        text={`${width} cm`}
        fontSize={14}
        fill="#9CA3AF"
        listening={false}
      />
      <Text
        x={-50}
        y={height / 2 - 7}
        text={`${height} cm`}
        fontSize={14}
        fill="#9CA3AF"
        rotation={-90}
        listening={false}
      />
    </>
  );
}
