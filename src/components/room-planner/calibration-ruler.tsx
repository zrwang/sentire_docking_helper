import { useState } from 'react';
import { Group, Line, Rect, Text } from 'react-konva';
import type Konva from 'konva';

interface CalibrationRulerProps {
  /** Canvas scale so stroke widths / text sizes stay constant in pixels. */
  scale: number;
  /** Initial top-left position of the ruler in room-space (cm). */
  initialX?: number;
  initialY?: number;
}

/**
 * A draggable "1 metre" reference ruler rendered in room-space. The ruler is
 * always exactly 100 cm wide at canvas scale, so the user can drag it onto a
 * scale bar / known-length feature in the imported picture and resize the
 * picture until the two line up. Shown only while the user is adjusting the
 * background image.
 */
export function CalibrationRuler({
  scale,
  initialX = 20,
  initialY = 20,
}: CalibrationRulerProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    setPos({ x: e.target.x(), y: e.target.y() });
  };

  // Screen-constant pixel sizes (divided by scale so they stay fixed while
  // the canvas zooms).
  const strokeW = 2 / scale;
  const capHeight = 14 / scale;
  const fontPx = 12 / scale;
  const padding = 3 / scale;

  // Label background (so the text stays readable over any picture).
  const labelText = '1 m';
  const labelW = 28 / scale;
  const labelH = fontPx + padding * 2;

  return (
    <Group
      x={pos.x}
      y={pos.y}
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
      {/* Main 100-cm horizontal line */}
      <Line
        points={[0, 0, 100, 0]}
        stroke="#FBBF24"
        strokeWidth={strokeW}
      />
      {/* Left end cap */}
      <Line
        points={[0, -capHeight / 2, 0, capHeight / 2]}
        stroke="#FBBF24"
        strokeWidth={strokeW}
      />
      {/* Right end cap */}
      <Line
        points={[100, -capHeight / 2, 100, capHeight / 2]}
        stroke="#FBBF24"
        strokeWidth={strokeW}
      />
      {/* Midpoint tick for extra alignment help */}
      <Line
        points={[50, -capHeight / 4, 50, capHeight / 4]}
        stroke="#FBBF24"
        strokeWidth={strokeW}
      />
      {/* Label centered above the line */}
      <Rect
        x={50 - labelW / 2}
        y={-labelH - capHeight / 2 - padding}
        width={labelW}
        height={labelH}
        fill="#1F2937"
        cornerRadius={2 / scale}
        stroke="#FBBF24"
        strokeWidth={1 / scale}
      />
      <Text
        x={50 - labelW / 2}
        y={-labelH - capHeight / 2 - padding + padding}
        width={labelW}
        height={labelH - padding * 2}
        align="center"
        verticalAlign="middle"
        text={labelText}
        fontSize={fontPx}
        fontStyle="bold"
        fill="#FBBF24"
        listening={false}
      />
    </Group>
  );
}
