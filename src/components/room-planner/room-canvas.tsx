import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useRoomStore } from '@/stores/room-store';
import { useAppStore } from '@/stores/app-store';
import { useCanvasZoom } from '@/hooks/use-canvas-zoom';
import { RoomGrid } from './room-grid';
import { RoomWalls } from './room-walls';
import { EquipmentItem } from './equipment-item';
import { BackgroundImage } from './background-image';
import { ContourEditor } from './contour-editor';

export function RoomCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { room } = useRoomStore();
  const { gridVisible, selectEquipment, contourEditMode } = useAppStore();
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

  return (
    <div ref={containerRef} className="flex-1 bg-gray-950 overflow-hidden relative">
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
      </Stage>
    </div>
  );
}
