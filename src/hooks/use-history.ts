import { useEffect } from 'react';
import { useRoomStore } from '@/stores/room-store';
import { useHistoryStore } from '@/stores/history-store';
import type { Room } from '@/types/room';

/**
 * Coalesce rapid consecutive edits (drags emit a stream of moveEquipment
 * calls; vertex drags emit one updatePolygonVertex per pixel) into a single
 * history entry so undo doesn't have to step through every intermediate
 * frame.
 */
const DEBOUNCE_MS = 300;

/**
 * Set to true while undo/redo is replacing the room: the resulting
 * room-store change shouldn't itself be recorded as a new history entry.
 * Module-scoped so the subscription closure (set up once) sees the latest
 * value without resubscribing.
 */
let isApplying = false;

/**
 * The room reference at the start of the current debounce window. We push
 * THIS reference (not the prev seen on every change) so a long drag is
 * undone back to its pre-drag state in a single step.
 */
let pendingPrev: Room | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function flushPending() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (pendingPrev) {
    useHistoryStore.getState().pushSnapshot(pendingPrev);
    pendingPrev = null;
  }
}

/**
 * Wires up undo/redo: subscribes to the room store to capture snapshots,
 * and registers Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z (or Cmd/Ctrl+Y) keyboard
 * shortcuts.
 *
 * Mount once at the app root.
 */
export function useHistory() {
  useEffect(() => {
    // Subscribe to room changes. We compare references because the store
    // always produces a new room object on update, and equipment items are
    // treated as immutable.
    const unsub = useRoomStore.subscribe((state, prev) => {
      if (isApplying) return;
      if (state.room === prev.room) return;
      // Open or extend the debounce window with the EARLIEST prev so a
      // continuous gesture collapses to a single undo step.
      if (pendingPrev === null) pendingPrev = prev.room;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        flushPending();
      }, DEBOUNCE_MS);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore while typing in an input/textarea/contenteditable so the
      // browser's own undo (text edits) keeps working.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const key = e.key.toLowerCase();

      // Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y -> redo
      if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      // Cmd/Ctrl+Z -> undo
      if (key === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

/**
 * Pop the latest snapshot off the undo stack and replace the current room
 * with it. Flushes any pending debounce first so a mid-drag undo behaves
 * intuitively (the in-progress edit becomes the redo target).
 */
export function undo() {
  flushPending();
  const current = useRoomStore.getState().room;
  const prev = useHistoryStore.getState().popUndo(current);
  if (!prev) return;
  isApplying = true;
  try {
    useRoomStore.getState().replaceRoom(prev);
  } finally {
    isApplying = false;
  }
}

export function redo() {
  flushPending();
  const current = useRoomStore.getState().room;
  const next = useHistoryStore.getState().popRedo(current);
  if (!next) return;
  isApplying = true;
  try {
    useRoomStore.getState().replaceRoom(next);
  } finally {
    isApplying = false;
  }
}
