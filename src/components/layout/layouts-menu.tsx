import { useEffect, useRef, useState } from 'react';
import { useLayoutsStore } from '@/stores/layouts-store';
import { useRoomStore } from '@/stores/room-store';
import { useAppStore } from '@/stores/app-store';

/**
 * Header dropdown for saving the current room layout to localStorage and
 * loading previously saved ones. Each entry is keyed by user-supplied name.
 */
export function LayoutsMenu() {
  const layouts = useLayoutsStore((s) => s.layouts);
  const save = useLayoutsStore((s) => s.save);
  const remove = useLayoutsStore((s) => s.remove);
  const demoName = useLayoutsStore((s) => s.demoName);
  const setDemo = useLayoutsStore((s) => s.setDemo);
  const room = useRoomStore((s) => s.room);
  const replaceRoom = useRoomStore((s) => s.replaceRoom);
  const selectEquipment = useAppStore((s) => s.selectEquipment);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const entries = Object.values(layouts).sort((a, b) => b.savedAt - a.savedAt);

  const handleSave = () => {
    const suggested = new Date().toLocaleString();
    const name = window.prompt('Save current layout as:', suggested);
    if (!name || !name.trim()) return;
    save(name.trim(), room);
    setOpen(false);
  };

  const handleLoad = (name: string) => {
    const entry = layouts[name];
    if (!entry) return;
    selectEquipment(null);
    replaceRoom(entry.room);
    setOpen(false);
  };

  const handleDelete = (name: string) => {
    if (!window.confirm(`Delete saved layout "${name}"?`)) return;
    remove(name);
  };

  const handleToggleDemo = (name: string) => {
    // Click the star to pin, click it again to clear back to the built-in
    // Partial Nephrectomy preset.
    setDemo(demoName === name ? null : name);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2.5 py-1 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 rounded"
      >
        Layouts ({entries.length})
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-72 bg-gray-900 border border-gray-700 rounded shadow-xl z-50 text-sm">
          <button
            onClick={handleSave}
            className="w-full text-left px-3 py-2 hover:bg-gray-800 text-emerald-400 font-medium border-b border-gray-800"
          >
            + Save current layout
          </button>
          <div className="max-h-72 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-500">
                No saved layouts yet. Click above to save the current room.
              </p>
            ) : (
              entries.map((entry) => {
                const isDemo = demoName === entry.name;
                return (
                  <div
                    key={entry.name}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 group"
                  >
                    <button
                      onClick={() => handleToggleDemo(entry.name)}
                      title={
                        isDemo
                          ? 'Unpin as demo (revert Load Demo to the built-in preset)'
                          : 'Pin this layout as the "Load Demo" target'
                      }
                      className={`shrink-0 text-sm leading-none ${
                        isDemo
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-gray-600 hover:text-amber-400'
                      }`}
                    >
                      {isDemo ? '★' : '☆'}
                    </button>
                    <button
                      onClick={() => handleLoad(entry.name)}
                      className="flex-1 min-w-0 text-left"
                      title="Load this layout (replaces current)"
                    >
                      <div className="flex items-center gap-1">
                        <span className="truncate text-gray-200">{entry.name}</span>
                        {isDemo && (
                          <span className="shrink-0 text-[9px] uppercase tracking-wide text-amber-400/80">
                            demo
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {new Date(entry.savedAt).toLocaleString()} -{' '}
                        {entry.room.equipment.length} item
                        {entry.room.equipment.length === 1 ? '' : 's'}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(entry.name)}
                      title="Delete"
                      className="text-[10px] text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
