import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
// Per-unit-of-wheel-delta zoom factor. A standard mouse wheel tick is
// deltaY ≈ 100 (⇒ ~14% per tick); trackpads fire small deltas many times
// per gesture (⇒ smooth, subtle zoom). Tuned down from a flat 1.1x to avoid
// "one scroll jumps two levels" on touchpads.
const ZOOM_PER_DELTA = 0.0015;

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

      // Delta-aware exponential zoom: a single mouse tick (deltaY≈100) gives a
      // ~16% zoom; trackpad deltas (often 1-10 per event) give small, smooth
      // steps. Negative deltaY means zoom in.
      const factor = Math.exp(-e.evt.deltaY * ZOOM_PER_DELTA);
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, oldScale * factor)
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

  /**
   * Compensate the stage pan so that a room-space shift of (dxRoom, dyRoom)
   * does NOT cause visual motion on the canvas. Used when normalizing the
   * polygon: vertices/equipment shift by (dx,dy) in room coords, and we
   * counter-shift the camera in pixel space by (-dx*scale, -dy*scale).
   */
  const panByRoomDelta = useCallback((dxRoom: number, dyRoom: number) => {
    if (!dxRoom && !dyRoom) return;
    setState((prev) => ({
      scale: prev.scale,
      position: {
        x: prev.position.x - dxRoom * prev.scale,
        y: prev.position.y - dyRoom * prev.scale,
      },
    }));
  }, []);

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
    panByRoomDelta,
  };
}
