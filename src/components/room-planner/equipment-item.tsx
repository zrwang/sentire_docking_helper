import { useRef, useState, useEffect } from 'react';
import { Group, Rect, Text, Circle, Line, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { Equipment } from '@/types/room';
import { useAppStore } from '@/stores/app-store';
import { useRoomStore } from '@/stores/room-store';
import { useIconStore } from '@/stores/icon-store';
import { snapToGrid } from '@/utils/snap';
import { getOverlappingItems } from '@/utils/collision';
import { ItemContourEditor } from './item-contour-editor';

interface EquipmentItemProps {
  item: Equipment;
  scale: number;
}

export function EquipmentItem({ item, scale }: EquipmentItemProps) {
  const groupRef = useRef<Konva.Group>(null);
  const { selectedEquipmentId, selectEquipment, snapEnabled, itemContourEditId } = useAppStore();
  const isContourEditing = itemContourEditId === item.id;
  const { room, moveEquipment, rotateEquipment, removeEquipment } = useRoomStore();
  const iconDataUrl = useIconStore((s) => s.icons[item.type]);
  const [iconImage, setIconImage] = useState<HTMLImageElement | null>(null);
  const [isOverlapping, setIsOverlapping] = useState(false);
  const isSelected = selectedEquipmentId === item.id;

  // Load the custom icon (if any) into an <img> so Konva can paint it.
  useEffect(() => {
    if (!iconDataUrl) {
      setIconImage(null);
      return;
    }
    const img = new window.Image();
    img.src = iconDataUrl;
    img.onload = () => setIconImage(img);
    return () => {
      img.onload = null;
    };
  }, [iconDataUrl]);

  const hw = item.dimensions.width / 2;
  const hh = item.dimensions.height / 2;

  const centerX = item.position.x + hw;
  const centerY = item.position.y + hh;

  // Distance (in cm) from the item's top to the rotation handle. Keeps the
  // handle visible at any zoom level.
  const handleOffset = 18 / scale + 8;

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

  // Any interaction (mousedown / touchstart / drag start) also selects, so
  // selection works even if Konva suppresses the click due to micro-movement.
  const handleSelectOnInteract = () => {
    if (selectedEquipmentId !== item.id) {
      selectEquipment(item.id);
    }
  };

  const handleRemove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Prevent the click from also bubbling to the Group/Stage
    e.cancelBubble = true;
    removeEquipment(item.id);
    if (selectedEquipmentId === item.id) selectEquipment(null);
  };

  const handleDblClick = () => {
    rotateEquipment(item.id, (item.rotation + 90) % 360);
  };

  const handleRotationDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent the parent Group's drag handlers from firing -- otherwise
    // handleDragEnd would misinterpret the handle's local coords and snap
    // the item to the room's upper-left corner.
    e.cancelBubble = true;
  };

  const handleRotationDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const layer = e.target.getLayer();
    if (!layer) return;
    const pointer = layer.getRelativePointerPosition();
    if (!pointer) return;
    const dx = pointer.x - centerX;
    const dy = pointer.y - centerY;
    // atan2 returns 0 = east; we want 0 = north (item's top), so +90.
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    angle = ((angle % 360) + 360) % 360;
    if (snapEnabled) angle = Math.round(angle / 15) * 15;
    rotateEquipment(item.id, angle);
    // Pin the handle to its local anchor so it stays "north" of the item.
    e.target.x(hw);
    e.target.y(-handleOffset);
  };

  const handleRotationDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.target.x(hw);
    e.target.y(-handleOffset);
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
      draggable={!item.isLocked && !isContourEditing}
      onDragStart={handleSelectOnInteract}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onMouseDown={handleSelectOnInteract}
      onTouchStart={handleSelectOnInteract}
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
      {iconImage ? (
        <>
          <KonvaImage
            image={iconImage}
            width={item.dimensions.width}
            height={item.dimensions.height}
            opacity={isOverlapping ? 0.8 : 1}
          />
          {/* Red overlay tint when overlapping */}
          {isOverlapping && (
            <Rect
              width={item.dimensions.width}
              height={item.dimensions.height}
              fill="#EF4444"
              opacity={0.3}
              listening={false}
            />
          )}
          {/* Selection border around the image */}
          {isSelected && (
            <Rect
              width={item.dimensions.width}
              height={item.dimensions.height}
              stroke="#60A5FA"
              strokeWidth={1.5 / scale}
              listening={false}
            />
          )}
        </>
      ) : item.polygon && item.polygon.length >= 3 ? (
        <Line
          points={item.polygon.flatMap((p) => [p.x, p.y])}
          closed
          fill={fillColor}
          opacity={isOverlapping ? 0.7 : 0.7}
          stroke={isSelected ? '#60A5FA' : '#4B5563'}
          strokeWidth={isSelected ? 1.5 / scale : 0.5 / scale}
        />
      ) : isCircle ? (
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

      {/* Label (hidden when a custom icon is drawn so it doesn't obscure it) */}
      {!iconImage && (
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
      )}

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

      {/* Rotation handle: a knob above the item; drag to rotate. */}
      {isSelected && !item.isLocked && (
        <>
          <Line
            points={[hw, 0, hw, -handleOffset]}
            stroke="#60A5FA"
            strokeWidth={1 / scale}
            dash={[4 / scale, 3 / scale]}
            listening={false}
          />
          <Circle
            x={hw}
            y={-handleOffset}
            radius={8 / scale}
            fill="#3B82F6"
            stroke="white"
            strokeWidth={1.5 / scale}
            draggable
            onMouseDown={(e) => {
              e.cancelBubble = true;
              handleSelectOnInteract();
            }}
            onTouchStart={(e) => {
              e.cancelBubble = true;
              handleSelectOnInteract();
            }}
            onDragStart={handleRotationDragStart}
            onDragMove={handleRotationDragMove}
            onDragEnd={handleRotationDragEnd}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'grab';
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = '';
            }}
          />
        </>
      )}

      {/* Per-item contour editor overlay */}
      {isContourEditing && <ItemContourEditor item={item} scale={scale} />}

      {/* In-canvas delete badge shown on the selected item */}
      {isSelected && !item.isLocked && (
        <Group
          x={item.dimensions.width}
          y={0}
          onClick={handleRemove}
          onTap={handleRemove}
        >
          <Circle
            radius={9 / scale}
            fill="#EF4444"
            stroke="white"
            strokeWidth={1 / scale}
          />
          <Text
            x={-9 / scale}
            y={-9 / scale}
            width={18 / scale}
            height={18 / scale}
            text="×"
            fontSize={14 / scale}
            fontStyle="bold"
            fill="white"
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        </Group>
      )}
    </Group>
  );
}
