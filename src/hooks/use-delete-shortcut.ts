import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useRoomStore } from '@/stores/room-store';

/**
 * Global keyboard shortcuts that act on the currently selected equipment:
 *   - Delete / Backspace -- remove the item
 *   - R                  -- rotate +90 degrees (Shift+R rotates -90)
 *
 * Ignored while the user is typing in an input, textarea, or contenteditable
 * element so text editing isn't disrupted.
 */
export function useDeleteShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const selectedId = useAppStore.getState().selectedEquipmentId;
      if (!selectedId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        useRoomStore.getState().removeEquipment(selectedId);
        useAppStore.getState().selectEquipment(null);
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        const room = useRoomStore.getState().room;
        const item = room.equipment.find((i) => i.id === selectedId);
        if (!item || item.isLocked) return;
        e.preventDefault();
        const delta = e.shiftKey ? -90 : 90;
        const next = ((item.rotation + delta) % 360 + 360) % 360;
        useRoomStore.getState().rotateEquipment(selectedId, next);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
