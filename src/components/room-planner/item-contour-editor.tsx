import { Circle, Group, Line } from 'react-konva';
import type Konva from 'konva';
import type { Equipment } from '@/types/room';
import { useRoomStore } from '@/stores/room-store';

interface ItemContourEditorProps {
  item: Equipment;
  scale: number;
}

/**
 * Vertex handles for editing a single equipment item's polygon outline.
 * Rendered inside the item's rotated Group so coordinates stay in the
 * item's local (unrotated) space.
 */
export function ItemContourEditor({ item, scale }: ItemContourEditorProps) {
  const {
    updateEquipmentVertex,
    insertEquipmentVertex,
    removeEquipmentVertex,
  } = useRoomStore();

  if (!item.polygon || item.polygon.length < 3) return null;

  const polygon = item.polygon;
  const { width, height } = item.dimensions;
  const vertexRadius = 7 / scale;
  const midRadius = 5 / scale;

  const clampX = (v: number) => Math.max(0, Math.min(width, v));
  const clampY = (v: number) => Math.max(0, Math.min(height, v));

  const handleVertexDrag =
    (idx: number) => (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true;
      const x = clampX(e.target.x());
      const y = clampY(e.target.y());
      e.target.x(x);
      e.target.y(y);
      updateEquipmentVertex(item.id, idx, { x, y });
    };

  const handleVertexClick =
    (idx: number) =>
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const evt = e.evt as MouseEvent;
      if (evt.altKey || evt.shiftKey) {
        e.cancelBubble = true;
        removeEquipmentVertex(item.id, idx);
      }
    };

  const handleMidpointClick =
    (insertAt: number, pos: { x: number; y: number }) =>
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      insertEquipmentVertex(item.id, insertAt, pos);
    };

  return (
    <Group>
      {/* Highlighted polygon outline */}
      <Line
        points={polygon.flatMap((p) => [p.x, p.y])}
        closed
        stroke="#F59E0B"
        strokeWidth={1.5 / scale}
        dash={[6 / scale, 3 / scale]}
        listening={false}
      />

      {/* Edge midpoints for inserting a new vertex */}
      {polygon.map((p, i) => {
        const next = polygon[(i + 1) % polygon.length];
        const mid = { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2 };
        return (
          <Circle
            key={`item-mid-${i}`}
            x={mid.x}
            y={mid.y}
            radius={midRadius}
            fill="#1F2937"
            stroke="#F59E0B"
            strokeWidth={1 / scale}
            onClick={handleMidpointClick(i + 1, mid)}
            onTap={handleMidpointClick(i + 1, mid)}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'copy';
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = '';
            }}
          />
        );
      })}

      {/* Vertex handles (draggable) */}
      {polygon.map((p, i) => (
        <Circle
          key={`item-vtx-${i}`}
          x={p.x}
          y={p.y}
          radius={vertexRadius}
          fill="#F59E0B"
          stroke="white"
          strokeWidth={1 / scale}
          draggable
          onDragStart={(e) => (e.cancelBubble = true)}
          onDragMove={handleVertexDrag(i)}
          onDragEnd={(e) => (e.cancelBubble = true)}
          onClick={handleVertexClick(i)}
          onTap={handleVertexClick(i)}
          onMouseEnter={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = '';
          }}
        />
      ))}
    </Group>
  );
}
