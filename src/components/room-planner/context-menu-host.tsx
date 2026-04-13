import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useContextMenuStore } from '@/stores/context-menu-store';
import { EquipmentProperties } from './equipment-properties';
import { TypeProperties } from './type-properties';

const MENU_WIDTH = 260;
const MENU_MARGIN = 8;

/**
 * Floating right-click panel. Clamps itself to the viewport, closes on
 * outside click or Escape, and renders either an equipment-instance editor
 * or a type-default editor depending on the current menu state.
 */
export function ContextMenuHost() {
  const menu = useContextMenuStore((s) => s.menu);
  const close = useContextMenuStore((s) => s.close);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Outside-click + Escape close.
  useEffect(() => {
    if (!menu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target as Node)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menu, close]);

  // Clamp the panel inside the viewport after it mounts / menu changes.
  useLayoutEffect(() => {
    if (!menu) {
      setPos(null);
      return;
    }
    const w = panelRef.current?.offsetWidth ?? MENU_WIDTH;
    const h = panelRef.current?.offsetHeight ?? 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(menu.x, MENU_MARGIN), vw - w - MENU_MARGIN);
    const top = Math.min(Math.max(menu.y, MENU_MARGIN), vh - h - MENU_MARGIN);
    setPos({ left, top });
  }, [menu]);

  if (!menu) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: pos?.left ?? menu.x,
        top: pos?.top ?? menu.y,
        width: MENU_WIDTH,
        visibility: pos ? 'visible' : 'hidden',
      }}
      className="z-50 bg-gray-900 border border-gray-700 rounded-md shadow-xl text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.kind === 'equipment' ? (
        <div className="p-2">
          <EquipmentProperties itemId={menu.id} onClose={close} embedded />
        </div>
      ) : (
        <TypeProperties type={menu.type} onClose={close} />
      )}
    </div>
  );
}
