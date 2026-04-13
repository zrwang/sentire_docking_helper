import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useRoomStore } from '@/stores/room-store';
import { useAppStore } from '@/stores/app-store';
import { useCanvasZoom } from '@/hooks/use-canvas-zoom';
import { MIN_ROOM_SIZE, MAX_ROOM_SIZE } from '@/constants/room-defaults';
import { snapToGrid } from '@/utils/snap';
import { PALETTE_ADD_MIME } from '@/constants/palette-dnd';
import { EQUIPMENT_CATALOG } from '@/constants/room-defaults';
import { useCustomEquipmentStore } from '@/stores/custom-equipment-store';
import { getTypeOverride } from '@/stores/type-overrides-store';
import type { EquipmentType } from '@/types/room';
import { RoomGrid } from './room-grid';
import { RoomWalls } from './room-walls';
import { EquipmentItem } from './equipment-item';
import { BackgroundImage } from './background-image';
import { ContourEditor } from './contour-editor';

export function RoomCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { room, setRoomDimensions, addEquipmentAt } = useRoomStore();
  const { gridVisible, snapEnabled, selectEquipment, contourEditMode } = useAppStore();
  const { scale, position, stageRef, handleWheel, resetZoom } =
    useCanvasZoom(0.6);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      setContainerSize({ width: w, height: h });
    }
  }, []);

  useEffect(() => {
    updateSize();
    const timer = setTimeout(() => {
      if (containerRef.current) {
        resetZoom(
          containerRef.current.offsetWidth,
          containerRef.current.offsetHeight,
          room.width,
          room.height
        );
      }
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When room dimensions change dramatically (e.g. after import), refit view
  useEffect(() => {
    if (containerRef.current) {
      resetZoom(
        containerRef.current.offsetWidth,
        containerRef.current.offsetHeight,
        room.width,
        room.height
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.width, room.height, room.shape]);

  useEffect(() => {
    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSize]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      selectEquipment(null);
    }
  };

  // Drag handle on the room's bottom-right corner. Only shown for rectangular
  // rooms -- polygon rooms are reshaped via the contour editor instead. The
  // handle's local x/y give the new width/height directly since it lives on
  // a layer in room-space.
  const handleRoomResizeDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const node = e.target;
    let w = Math.max(MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, node.x()));
    let h = Math.max(MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, node.y()));
    if (snapEnabled) {
      w = snapToGrid(w, room.gridSize);
      h = snapToGrid(h, room.gridSize);
    }
    setRoomDimensions(w, h);
    node.x(w);
    node.y(h);
  };

  const handleRoomResizeDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.target.x(room.width);
    e.target.y(room.height);
  };

  const showRoomResizeHandle =
    !contourEditMode && room.shape !== 'polygon';

  // Resolve a catalog entry's default dimensions so we can drop the item
  // centered on the cursor (same defaults that addEquipmentAt will actually
  // use, so visual placement and final placement match).
  const resolveDropDimensions = (type: EquipmentType) => {
    const catalog =
      EQUIPMENT_CATALOG.find((e) => e.type === type) ??
      useCustomEquipmentStore.getState().entries.find((e) => e.type === type);
    if (!catalog) return null;
    const override = getTypeOverride(type);
    return override?.dimensions
      ? { ...override.dimensions }
      : { ...catalog.dimensions };
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Only treat drags carrying our add-MIME as a valid target -- everything
    // else (text, files, reorder payloads from the sidebar) should pass
    // through. Browsers hide the MIME list during dragover for security, so
    // check `types` instead of `getData`.
    if (!e.dataTransfer.types.includes(PALETTE_ADD_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const type = e.dataTransfer.getData(PALETTE_ADD_MIME) as EquipmentType;
    if (!type) return;
    e.preventDefault();

    const stage = stageRef.current;
    const container = containerRef.current;
    if (!stage || !container) return;

    // Convert the client-space drop point into stage-local (room) coords.
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const transform = stage.getAbsoluteTransform().copy().invert();
    const roomPoint = transform.point({ x: clientX, y: clientY });

    // Center the item on the cursor using its resolved default dimensions.
    const dims = resolveDropDimensions(type);
    const topLeft = dims
      ? { x: roomPoint.x - dims.width / 2, y: roomPoint.y - dims.height / 2 }
      : roomPoint;
    const position = snapEnabled
      ? {
          x: snapToGrid(topLeft.x, room.gridSize),
          y: snapToGrid(topLeft.y, room.gridSize),
        }
      : topLeft;

    addEquipmentAt(type, position);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 bg-gray-950 overflow-hidden relative"
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        {/* Room floor + walls */}
        <Layer listening={false}>
          <RoomWalls room={room} />
        </Layer>

        {/* Optional uploaded background image */}
        {room.backgroundImage && (
          <Layer listening={false}>
            <BackgroundImage
              dataUrl={room.backgroundImage}
              width={room.width}
              height={room.height}
              opacity={room.backgroundOpacity ?? 0.35}
            />
          </Layer>
        )}

        {/* Grid */}
        <Layer listening={false}>
          <RoomGrid
            width={room.width}
            height={room.height}
            gridSize={room.gridSize}
            visible={gridVisible}
          />
        </Layer>

        {/* Equipment */}
        <Layer>
          {room.equipment.map((item) => (
            <EquipmentItem key={item.id} item={item} scale={scale} />
          ))}
        </Layer>

        {/* Contour editor overlay */}
        {contourEditMode && (
          <Layer>
            <ContourEditor scale={scale} />
          </Layer>
        )}

        {/* Room resize handle (rectangular rooms only) */}
        {showRoomResizeHandle && (
          <Layer>
            <Rect
              x={room.width}
              y={room.height}
              width={14 / scale}
              height={14 / scale}
              offsetX={7 / scale}
              offsetY={7 / scale}
              fill="#10B981"
              stroke="white"
              strokeWidth={1.5 / scale}
              cornerRadius={2 / scale}
              draggable
              onDragMove={handleRoomResizeDragMove}
              onDragEnd={handleRoomResizeDragEnd}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'nwse-resize';
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = '';
              }}
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
}
