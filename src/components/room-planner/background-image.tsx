import { useEffect, useState } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import type Konva from 'konva';

interface BackgroundImageProps {
  dataUrl: string;
  /** Where the image sits in room-space (cm). */
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  /** When true, user can drag the image and resize it via the corner handle. */
  adjustable?: boolean;
  /** Canvas scale factor so handle sizing stays constant in screen pixels. */
  scale?: number;
  /** Called during drag with the new (x, y) in cm. */
  onMove?: (next: { x: number; y: number }) => void;
  /** Called during corner resize with the new width / height in cm. */
  onResize?: (next: { width: number; height: number }) => void;
}

/**
 * Renders the uploaded floor-plan image behind the editable layer.
 *
 * By default the image is non-interactive (`adjustable={false}`). When
 * adjustable is on, the image becomes draggable and shows an outline plus a
 * bottom-right corner handle that preserves the image's aspect ratio while
 * resizing. Legacy data without an explicit transform still renders correctly
 * because the caller collapses the transform to cover the whole room.
 */
export function BackgroundImage({
  dataUrl,
  x,
  y,
  width,
  height,
  opacity,
  adjustable = false,
  scale = 1,
  onMove,
  onResize,
}: BackgroundImageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      setImage(null);
      return;
    }
    // Race-safe load: register the handler before assigning src so data URLs
    // that decode synchronously still notify us.
    const img = new window.Image();
    let cancelled = false;
    img.onload = () => {
      if (!cancelled) setImage(img);
    };
    img.src = dataUrl;
    if (img.complete && img.naturalWidth > 0) setImage(img);
    return () => {
      cancelled = true;
      img.onload = null;
    };
  }, [dataUrl]);

  if (!image) return null;

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!onMove) return;
    e.cancelBubble = true;
    const node = e.target;
    onMove({ x: node.x(), y: node.y() });
  };

  // Keep a stable aspect ratio from the image's natural dimensions so the
  // corner drag feels predictable (width and height scale together).
  const naturalAspect =
    image.naturalWidth > 0 && image.naturalHeight > 0
      ? image.naturalHeight / image.naturalWidth
      : height / Math.max(width, 1);

  const handleResizeDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!onResize) return;
    e.cancelBubble = true;
    const node = e.target;
    // The handle's local coordinates (inside the draggable Group) are the
    // image's local bottom-right corner, i.e. its width / height.
    const nextW = Math.max(20, node.x());
    const nextH = Math.max(20, nextW * naturalAspect);
    onResize({ width: nextW, height: nextH });
    node.x(nextW);
    node.y(nextH);
  };

  const handleResizeDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    e.target.x(width);
    e.target.y(height);
  };

  if (!adjustable) {
    return (
      <KonvaImage
        image={image}
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={opacity}
        listening={false}
      />
    );
  }

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragMove={handleDragMove}
      onMouseEnter={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'move';
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = '';
      }}
    >
      <KonvaImage
        image={image}
        x={0}
        y={0}
        width={width}
        height={height}
        opacity={opacity}
      />
      {/* Dashed outline so the user can see the image bounds even when the
          raster itself is mostly transparent near the edges. */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        stroke="#10B981"
        strokeWidth={1.5 / scale}
        dash={[8 / scale, 5 / scale]}
        listening={false}
      />
      {/* Bottom-right resize handle -- aspect-ratio preserved. */}
      <Rect
        x={width}
        y={height}
        width={14 / scale}
        height={14 / scale}
        offsetX={7 / scale}
        offsetY={7 / scale}
        fill="#10B981"
        stroke="white"
        strokeWidth={1.5 / scale}
        cornerRadius={2 / scale}
        draggable
        onDragMove={handleResizeDragMove}
        onDragEnd={handleResizeDragEnd}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'nwse-resize';
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = '';
        }}
      />
    </Group>
  );
}
