import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const ZOOM_FACTOR = 1.1;

interface CanvasZoomState {
  scale: number;
  position: { x: number; y: number };
}

export function useCanvasZoom(initialScale = 0.6) {
  const [state, setState] = useState<CanvasZoomState>({
    scale: initialScale,
    position: { x: 50, y: 50 },
  });
  const stageRef = useRef<Konva.Stage>(null);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = state.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, direction > 0 ? oldScale * ZOOM_FACTOR : oldScale / ZOOM_FACTOR)
      );

      // Zoom toward pointer position
      const mousePointTo = {
        x: (pointer.x - state.position.x) / oldScale,
        y: (pointer.y - state.position.y) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setState({ scale: newScale, position: newPos });
    },
    [state.scale, state.position]
  );

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // Only update position if stage itself was dragged (not an item on the stage)
      if (e.target === stageRef.current) {
        setState((prev) => ({
          ...prev,
          position: { x: e.target.x(), y: e.target.y() },
        }));
      }
    },
    []
  );

  const resetZoom = useCallback((containerWidth: number, containerHeight: number, roomWidth: number, roomHeight: number) => {
    const padding = 60;
    const scaleX = (containerWidth - padding * 2) / roomWidth;
    const scaleY = (containerHeight - padding * 2) / roomHeight;
    const newScale = Math.min(scaleX, scaleY, MAX_SCALE);
    setState({
      scale: newScale,
      position: {
        x: (containerWidth - roomWidth * newScale) / 2,
        y: (containerHeight - roomHeight * newScale) / 2,
      },
    });
  }, []);

  return {
    scale: state.scale,
    position: state.position,
    stageRef,
    handleWheel,
    handleDragEnd,
    resetZoom,
  };
}
