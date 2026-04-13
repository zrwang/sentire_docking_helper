import { Circle, Line, Group } from 'react-konva';
import type Konva from 'konva';
import { useRoomStore } from '@/stores/room-store';
import { useAppStore } from '@/stores/app-store';
import { snapToGrid } from '@/utils/snap';

interface ContourEditorProps {
  scale: number;
}

/**
 * Renders draggable vertex handles and edge-midpoint "insert" handles over
 * the room polygon. Only active when contourEditMode is on.
 *
 *  - Drag a vertex to reshape the room. Snap-to-grid applies when enabled.
 *  - Click a midpoint handle to insert a new vertex there.
 *  - Remove a vertex by double-clicking it, right-clicking it, or
 *    Alt/Shift-clicking it (min 3 vertices).
 */
export function ContourEditor({ scale }: ContourEditorProps) {
  const room = useRoomStore((s) => s.room);
  const snapEnabled = useAppStore((s) => s.snapEnabled);
  const {
    updatePolygonVertex,
    insertPolygonVertex,
    removePolygonVertex,
    normalizeRoom,
  } = useRoomStore();

  if (room.shape !== 'polygon' || !room.polygon || room.polygon.length < 3) {
    return null;
  }

  const polygon = room.polygon;
  const vertexRadius = 9 / scale;
  const midRadius = 6 / scale;

  const maybeSnap = (v: number) =>
    snapEnabled ? snapToGrid(v, room.gridSize) : v;

  const handleVertexDrag =
    (idx: number) => (e: Konva.KonvaEventObject<DragEvent>) => {
      const x = maybeSnap(e.target.x());
      const y = maybeSnap(e.target.y());
      e.target.x(x);
      e.target.y(y);
      updatePolygonVertex(idx, { x, y });
    };

  const handleVertexDragEnd = () => {
    normalizeRoom();
  };

  const removeVertex =
    (idx: number) =>
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      e.evt?.preventDefault?.();
      removePolygonVertex(idx);
      normalizeRoom();
    };

  const handleVertexClick =
    (idx: number) =>
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const evt = e.evt as MouseEvent;
      if (evt.altKey || evt.shiftKey) {
        removeVertex(idx)(e);
      }
    };

  const handleMidpointClick =
    (insertAt: number, pos: { x: number; y: number }) =>
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      e.cancelBubble = true;
      insertPolygonVertex(insertAt, pos);
    };

  return (
    <Group>
      {/* Edge midpoints (insert-a-vertex handles). Rendered first so they
          sit beneath vertex handles at junction points. */}
      {polygon.map((p, i) => {
        const next = polygon[(i + 1) % polygon.length];
        const mid = { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2 };
        return (
          <Circle
            key={`mid-${i}`}
            x={mid.x}
            y={mid.y}
            radius={midRadius}
            fill="#1F2937"
            stroke="#9CA3AF"
            strokeWidth={1.5 / scale}
            dash={[3 / scale, 2 / scale]}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'copy';
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = '';
            }}
            onClick={handleMidpointClick(i + 1, mid)}
            onTap={handleMidpointClick(i + 1, mid)}
          />
        );
      })}

      {/* Vertex handles (draggable) */}
      {polygon.map((p, i) => (
        <Circle
          key={`vtx-${i}`}
          x={p.x}
          y={p.y}
          radius={vertexRadius}
          fill="#3B82F6"
          stroke="white"
          strokeWidth={1.5 / scale}
          draggable
          onDragMove={handleVertexDrag(i)}
          onDragEnd={handleVertexDragEnd}
          onClick={handleVertexClick(i)}
          onTap={handleVertexClick(i)}
          onDblClick={removeVertex(i)}
          onDblTap={removeVertex(i)}
          onContextMenu={removeVertex(i)}
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

      {/* Highlight the polygon edges while editing */}
      <Line
        points={polygon.flatMap((p) => [p.x, p.y])}
        closed
        stroke="#60A5FA"
        strokeWidth={2 / scale}
        dash={[8 / scale, 4 / scale]}
        listening={false}
      />
    </Group>
  );
}
