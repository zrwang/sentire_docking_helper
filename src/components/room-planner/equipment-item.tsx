import { useRef, useState, useEffect } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import type Konva from 'konva';
import type { Equipment } from '@/types/room';
import { useAppStore } from '@/stores/app-store';
import { useRoomStore } from '@/stores/room-store';
import { snapToGrid } from '@/utils/snap';
import { getOverlappingItems } from '@/utils/collision';

interface EquipmentItemProps {
  item: Equipment;
  scale: number;
}

export function EquipmentItem({ item, scale }: EquipmentItemProps) {
  const groupRef = useRef<Konva.Group>(null);
  const { selectedEquipmentId, selectEquipment, snapEnabled } = useAppStore();
  const { room, moveEquipment, rotateEquipment } = useRoomStore();
  const [isOverlapping, setIsOverlapping] = useState(false);
  const isSelected = selectedEquipmentId === item.id;

  const hw = item.dimensions.width / 2;
  const hh = item.dimensions.height / 2;

  const centerX = item.position.x + hw;
  const centerY = item.position.y + hh;

  useEffect(() => {
    const overlaps = getOverlappingItems(item, room.equipment);
    setIsOverlapping(overlaps.length > 0);
  }, [item, room.equipment]);

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let cx = node.x();
    let cy = node.y();

    let tlx = cx - hw;
    let tly = cy - hh;

    if (snapEnabled) {
      tlx = snapToGrid(tlx, room.gridSize);
      tly = snapToGrid(tly, room.gridSize);
    }

    tlx = Math.max(0, Math.min(tlx, room.width - item.dimensions.width));
    tly = Math.max(0, Math.min(tly, room.height - item.dimensions.height));

    node.x(tlx + hw);
    node.y(tly + hh);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const tlx = node.x() - hw;
    const tly = node.y() - hh;
    moveEquipment(item.id, { x: tlx, y: tly });
  };

  const handleClick = () => {
    selectEquipment(item.id);
  };

  const handleDblClick = () => {
    rotateEquipment(item.id, item.rotation + 90);
  };

  const fillColor = isOverlapping ? '#EF4444' : item.color;
  const isCircle = item.shape === 'circle';

  const maxChars = Math.floor(item.dimensions.width / 7);
  const displayLabel =
    item.label.length > maxChars
      ? item.label.slice(0, maxChars - 1) + '...'
      : item.label;

  return (
    <Group
      ref={groupRef}
      x={centerX}
      y={centerY}
      offsetX={hw}
      offsetY={hh}
      rotation={item.rotation}
      draggable={!item.isLocked}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
    >
      {/* Selection border */}
      {isSelected && !isCircle && (
        <Rect
          x={-3}
          y={-3}
          width={item.dimensions.width + 6}
          height={item.dimensions.height + 6}
          stroke="#3B82F6"
          strokeWidth={2 / scale}
          dash={[6, 3]}
          listening={false}
        />
      )}
      {isSelected && isCircle && (
        <Circle
          x={hw}
          y={hh}
          radius={hw + 3}
          stroke="#3B82F6"
          strokeWidth={2 / scale}
          dash={[6, 3]}
          listening={false}
        />
      )}

      {/* Equipment body */}
      {isCircle ? (
        <Circle
          x={hw}
          y={hh}
          radius={hw}
          fill={fillColor}
          opacity={isOverlapping ? 0.75 : 0.75}
          stroke={isSelected ? '#60A5FA' : '#4B5563'}
          strokeWidth={isSelected ? 1.5 / scale : 0.5 / scale}
        />
      ) : (
        <Rect
          width={item.dimensions.width}
          height={item.dimensions.height}
          fill={fillColor}
          opacity={isOverlapping ? 0.7 : 0.7}
          stroke={isSelected ? '#60A5FA' : '#4B5563'}
          strokeWidth={isSelected ? 1.5 / scale : 0.5 / scale}
          cornerRadius={3}
        />
      )}

      {/* Label */}
      <Text
        width={item.dimensions.width}
        height={item.dimensions.height}
        text={displayLabel}
        fontSize={Math.min(11, Math.max(7, item.dimensions.height / 4))}
        fill="white"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        listening={false}
      />

      {/* Lock indicator */}
      {item.isLocked && (
        <Text
          x={2}
          y={2}
          text="L"
          fontSize={10}
          fill="#FCD34D"
          listening={false}
        />
      )}
    </Group>
  );
}
