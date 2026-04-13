import { useCallback, useRef, useState } from 'react';
import type { DragEvent } from 'react';

export interface ReorderRowProps {
  draggable: boolean;
  onDragStart: (e: DragEvent<HTMLElement>) => void;
  onDragEnter: (e: DragEvent<HTMLElement>) => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
  onDragEnd: (e: DragEvent<HTMLElement>) => void;
  /** Pass-through visual hint the caller can apply during drag. */
  'data-drag-state'?: 'source' | 'target' | undefined;
}

interface Options {
  /** Called with the old and new indices once a drop completes. */
  onReorder: (fromIndex: number, toIndex: number) => void;
  /** Optional MIME type so multiple reorderable lists don't collide. */
  mimeType?: string;
}

/**
 * Tiny HTML5 drag-and-drop reorder helper. Returns a `getRowProps(index)`
 * function that wires the events onto each row. The caller is responsible for
 * its own rendering / layout; this hook only owns the drag state.
 */
export function useListReorder({ onReorder, mimeType }: Options) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // Store the starting index in a ref so we don't rely on state during the
  // (potentially noisy) dragover/drop sequence.
  const startIndexRef = useRef<number | null>(null);
  const MIME = mimeType ?? 'application/x-list-reorder';

  const reset = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
    startIndexRef.current = null;
  }, []);

  const getRowProps = useCallback(
    (index: number): ReorderRowProps => ({
      draggable: true,
      onDragStart: (e) => {
        startIndexRef.current = index;
        setDragIndex(index);
        // Needed for Firefox to actually start the drag.
        try {
          e.dataTransfer.setData(MIME, String(index));
        } catch {
          /* ignore */
        }
        e.dataTransfer.effectAllowed = 'move';
      },
      onDragEnter: (e) => {
        if (startIndexRef.current === null) return;
        e.preventDefault();
        if (overIndex !== index) setOverIndex(index);
      },
      onDragOver: (e) => {
        if (startIndexRef.current === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      },
      onDrop: (e) => {
        const from = startIndexRef.current;
        if (from === null) return;
        e.preventDefault();
        if (from !== index) onReorder(from, index);
        reset();
      },
      onDragEnd: () => reset(),
      'data-drag-state':
        dragIndex === index
          ? 'source'
          : overIndex === index
            ? 'target'
            : undefined,
    }),
    [MIME, dragIndex, overIndex, onReorder, reset]
  );

  return {
    dragIndex,
    overIndex,
    getRowProps,
  };
}
