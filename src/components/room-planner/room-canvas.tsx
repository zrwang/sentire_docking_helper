import { useEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';
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
import type { EquipmentType, Position } from '@/types/room';
import { RoomGrid } from './room-grid';
import { RoomWalls } from './room-walls';
import { EquipmentItem } from './equipment-item';
import { BackgroundImage } from './background-image';
import { ContourEditor } from './contour-editor';

export function RoomCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { room, setRoomDimensions, addEquipmentAt, setBackgroundTransform } =
    useRoomStore();
  const { gridVisible, snapEnabled, selectEquipment, contourEditMode, bgAdjustMode, bgCalibrationMode, setBgCalibrationMode, setCanvasExporter } =
    useAppStore();
  const { scale, position, stageRef, handleWheel, handleDragEnd, resetZoom, panByRoomDelta } =
    useCanvasZoom(0.6);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Two-click reference-line workflow for rescaling the background picture:
  // first click lands here, the second click commits the scale.
  const [calibrationStart, setCalibrationStart] = useState<Position | null>(null);
  const [calibrationHover, setCalibrationHover] = useState<Position | null>(null);

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

  // When room dimensions change dramatically (e.g. after import), refit the
  // view. We skip refits while the contour is being edited (so vertex drags
  // don't yank the camera around) AND we skip the first refit right after
  // exiting edit mode -- the ContourEditor's unmount pan already kept the
  // room visually anchored, and a refit here would slide it back to center.
  const wasInContourEditRef = useRef(false);
  useEffect(() => {
    if (contourEditMode) {
      wasInContourEditRef.current = true;
      return;
    }
    if (wasInContourEditRef.current) {
      // Just transitioned out of edit mode. Clear the flag and leave the
      // camera where the compensation put it.
      wasInContourEditRef.current = false;
      return;
    }
    if (containerRef.current) {
      resetZoom(
        containerRef.current.offsetWidth,
        containerRef.current.offsetHeight,
        room.width,
        room.height
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.width, room.height, room.shape, contourEditMode]);

  useEffect(() => {
    const handleResize = () => updateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSize]);

  // Expose a PNG/JPEG exporter through the app store so AppHeader (and other
  // non-child components) can save the current canvas without needing a ref
  // into this subtree.
  useEffect(() => {
    setCanvasExporter(({ mimeType, quality }) => {
      const stage = stageRef.current;
      if (!stage) return null;
      return stage.toDataURL({
        mimeType,
        quality: quality ?? 0.92,
        pixelRatio: 2,
      });
    });
    return () => setCanvasExporter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convert the current pointer position to room-space (stage-local) coords.
  const pointerInRoom = (): Position | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return stage.getAbsoluteTransform().copy().invert().point(pointer);
  };

  /**
   * Apply the user-drawn reference line: the distance between the two clicks
   * is treated as exactly 100 cm, and the background picture is scaled by
   * the corresponding factor (aspect-preserving). The scale pivots on the
   * midpoint of the drawn line so the feature the user measured stays put.
   */
  const applyCalibrationScale = (a: Position, b: Position) => {
    const lengthCm = Math.hypot(b.x - a.x, b.y - a.y);
    if (lengthCm < 1) return; // ignore accidental near-zero lines
    const k = 100 / lengthCm;
    const curW = room.backgroundWidth ?? room.width;
    const curH = room.backgroundHeight ?? room.height;
    const curX = room.backgroundX ?? 0;
    const curY = room.backgroundY ?? 0;
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    setBackgroundTransform({
      x: midX - (midX - curX) * k,
      y: midY - (midY - curY) * k,
      width: curW * k,
      height: curH * k,
    });
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (bgCalibrationMode) {
      const pt = pointerInRoom();
      if (!pt) return;
      if (!calibrationStart) {
        setCalibrationStart(pt);
      } else {
        applyCalibrationScale(calibrationStart, pt);
        setCalibrationStart(null);
        setCalibrationHover(null);
        setBgCalibrationMode(false);
      }
      return;
    }
    if (e.target === e.target.getStage()) {
      selectEquipment(null);
    }
  };

  const handleStageMouseMove = () => {
    if (!bgCalibrationMode || !calibrationStart) return;
    const pt = pointerInRoom();
    if (pt) setCalibrationHover(pt);
  };

  // Exit calibration cleanly if the user presses Escape.
  useEffect(() => {
    if (!bgCalibrationMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBgCalibrationMode(false);
        setCalibrationStart(null);
        setCalibrationHover(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bgCalibrationMode, setBgCalibrationMode]);

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
    // Always accept the drag so the drop event fires -- we validate the MIME
    // in handleDrop. (Some browsers expose dataTransfer.types as a DOMStringList
    // during dragover, which lacks `.includes`, so a MIME filter here is
    // unreliable. A permissive dragover + strict drop check is the portable
    // pattern.)
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const type = e.dataTransfer.getData(PALETTE_ADD_MIME) as EquipmentType;
    // Ignore drops that don't carry a palette payload (e.g. text drags).
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

  const cancelCalibration = () => {
    setBgCalibrationMode(false);
    setCalibrationStart(null);
    setCalibrationHover(null);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 bg-gray-950 overflow-hidden relative"
      style={bgCalibrationMode ? { cursor: 'crosshair' } : undefined}
    >
      {bgCalibrationMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-amber-500 text-black px-3 py-1.5 rounded shadow text-xs font-medium flex items-center gap-3">
          <span>
            {calibrationStart
              ? 'Click the second point — the distance between your clicks will be set to 1 m.'
              : 'Click the first point of a known 1 m feature on your picture.'}
          </span>
          <button
            onClick={cancelCalibration}
            className="text-[11px] underline hover:text-amber-900"
          >
            Cancel
          </button>
        </div>
      )}
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        // While the user is placing the two reference clicks, disable stage
        // panning so a drag doesn't hijack the second click.
        draggable={!bgCalibrationMode}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handleStageMouseMove}
      >
        {/* Room floor + walls */}
        <Layer listening={false}>
          <RoomWalls room={room} />
        </Layer>

        {/* Optional uploaded background image */}
        {room.backgroundImage && (
          <Layer listening={bgAdjustMode}>
            <BackgroundImage
              dataUrl={room.backgroundImage}
              x={room.backgroundX ?? 0}
              y={room.backgroundY ?? 0}
              width={room.backgroundWidth ?? room.width}
              height={room.backgroundHeight ?? room.height}
              opacity={room.backgroundOpacity ?? 0.35}
              adjustable={bgAdjustMode}
              scale={scale}
              onMove={(p) => setBackgroundTransform(p)}
              onResize={(s) => setBackgroundTransform(s)}
            />
          </Layer>
        )}

        {/* Scale-calibration overlay: first-click marker + rubber-band line */}
        {bgCalibrationMode && calibrationStart && (
          <Layer listening={false}>
            <Circle
              x={calibrationStart.x}
              y={calibrationStart.y}
              radius={6 / scale}
              fill="#FBBF24"
              stroke="white"
              strokeWidth={1.5 / scale}
            />
            {calibrationHover && (
              <>
                <Line
                  points={[
                    calibrationStart.x,
                    calibrationStart.y,
                    calibrationHover.x,
                    calibrationHover.y,
                  ]}
                  stroke="#FBBF24"
                  strokeWidth={2 / scale}
                  dash={[8 / scale, 4 / scale]}
                />
                <Circle
                  x={calibrationHover.x}
                  y={calibrationHover.y}
                  radius={5 / scale}
                  fill="#FBBF24"
                  opacity={0.6}
                />
              </>
            )}
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
            <ContourEditor scale={scale} onNormalized={panByRoomDelta} />
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
