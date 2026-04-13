import { useEffect } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useRoomStore } from '@/stores/room-store';

/**
 * Global Delete / Backspace shortcut that removes the currently selected
 * equipment. Ignored while the user is typing in an input, textarea, or
 * contenteditable element so text editing isn't disrupted.
 */
export function useDeleteShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

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

      e.preventDefault();
      useRoomStore.getState().removeEquipment(selectedId);
      useAppStore.getState().selectEquipment(null);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
