import { useRef } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useRoomStore } from '@/stores/room-store';
import { useIconStore } from '@/stores/icon-store';

interface EquipmentPropertiesProps {
  /** Item to edit. Falls back to the currently selected equipment. */
  itemId?: string;
  /** Optional callback invoked after a destructive action (e.g. delete). */
  onClose?: () => void;
  /** When true, render without an outer container (caller handles chrome). */
  embedded?: boolean;
}

/**
 * Inline editor for a single piece of equipment. Used both as a right-click
 * context menu panel and (historically) inside the side panel. Accepts an
 * explicit `itemId` so it can render for any item, not just the selected one.
 */
export function EquipmentProperties({ itemId, onClose, embedded }: EquipmentPropertiesProps = {}) {
  const selectedId = useAppStore((s) => s.selectedEquipmentId);
  const selectEquipment = useAppStore((s) => s.selectEquipment);
  const itemContourEditId = useAppStore((s) => s.itemContourEditId);
  const setItemContourEditId = useAppStore((s) => s.setItemContourEditId);
  const {
    room,
    moveEquipment,
    rotateEquipment,
    resizeEquipment,
    convertEquipmentToPolygon,
    setEquipmentPolygon,
    toggleLock,
    removeEquipment,
  } = useRoomStore();
  const icons = useIconStore((s) => s.icons);
  const setIcon = useIconStore((s) => s.setIcon);
  const clearIcon = useIconStore((s) => s.clearIcon);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const targetId = itemId ?? selectedId;
  const item = room.equipment.find((e) => e.id === targetId);

  if (!item) {
    return (
      <div className="text-xs text-gray-500 px-2 py-1">
        Select an item to view its properties.
      </div>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    moveEquipment(item.id, {
      ...item.position,
      [axis]: num,
    });
  };

  const handleRotationChange = (value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    rotateEquipment(item.id, num);
  };

  const handleSizeChange = (axis: 'width' | 'height', value: string) => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) return;
    resizeEquipment(item.id, { ...item.dimensions, [axis]: num });
  };

  const isEditingShape = itemContourEditId === item.id;
  const handleToggleShapeEdit = () => {
    if (isEditingShape) {
      setItemContourEditId(null);
    } else {
      if (!item.polygon) convertEquipmentToPolygon(item.id);
      setItemContourEditId(item.id);
    }
    onClose?.();
  };

  const handleResetShape = () => {
    setEquipmentPolygon(item.id, null);
    if (isEditingShape) setItemContourEditId(null);
  };

  const handleDelete = () => {
    removeEquipment(item.id);
    selectEquipment(null);
    onClose?.();
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;
      setIcon(item.type, dataUrl);

      // Preserve the icon's aspect ratio by adjusting the item's dimensions.
      // Keep the current larger side fixed so the item doesn't jump in size;
      // resize the other side to match the icon's ratio. resizeEquipment
      // already propagates to every item sharing this type.
      const img = new Image();
      img.onload = () => {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;
        const ratio = iw / ih;
        const { width: curW, height: curH } = item.dimensions;
        let newW: number;
        let newH: number;
        if (curW >= curH) {
          newW = curW;
          newH = curW / ratio;
        } else {
          newH = curH;
          newW = curH * ratio;
        }
        resizeEquipment(item.id, { width: newW, height: newH });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // allow re-selecting the same file later
    e.target.value = '';
  };

  const currentIcon = icons[item.type];

  const body = (
    <div className="flex flex-col gap-3">
      {/* Name */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm font-medium text-white">{item.label}</span>
        </div>
        <span className="text-[10px] text-gray-500">
          {Math.round(item.dimensions.width)} x {Math.round(item.dimensions.height)} cm
        </span>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">X (cm)</label>
          <input
            type="number"
            value={Math.round(item.position.x)}
            onChange={(e) => handlePositionChange('x', e.target.value)}
            disabled={item.isLocked}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Y (cm)</label>
          <input
            type="number"
            value={Math.round(item.position.y)}
            onChange={(e) => handlePositionChange('y', e.target.value)}
            disabled={item.isLocked}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white disabled:opacity-50"
          />
        </div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Width (cm)</label>
          <input
            type="number"
            value={Math.round(item.dimensions.width)}
            min={5}
            onChange={(e) => handleSizeChange('width', e.target.value)}
            disabled={item.isLocked}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Height (cm)</label>
          <input
            type="number"
            value={Math.round(item.dimensions.height)}
            min={5}
            onChange={(e) => handleSizeChange('height', e.target.value)}
            disabled={item.isLocked}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white disabled:opacity-50"
          />
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-[10px] text-gray-500 mb-0.5">Rotation (deg)</label>
        <input
          type="number"
          value={item.rotation}
          onChange={(e) => handleRotationChange(e.target.value)}
          step={15}
          disabled={item.isLocked}
          className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white disabled:opacity-50"
        />
      </div>

      {/* Shape / contour */}
      <div className="flex gap-2">
        <button
          onClick={handleToggleShapeEdit}
          disabled={item.isLocked}
          title="Drag vertices to reshape. Click an edge midpoint to add a vertex. Alt+click a vertex to delete."
          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium disabled:opacity-50 ${
            isEditingShape
              ? 'bg-amber-500 text-black hover:bg-amber-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {isEditingShape ? 'Done Shape' : 'Edit Shape'}
        </button>
        {item.polygon && (
          <button
            onClick={handleResetShape}
            disabled={item.isLocked}
            title="Revert to the default rectangular outline"
            className="px-2 py-1.5 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>

      {/* Custom icon */}
      <div className="pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] text-gray-500">
            Icon for all "{item.label}"
          </label>
          {currentIcon && (
            <button
              onClick={() => clearIcon(item.type)}
              className="text-[10px] text-gray-500 hover:text-red-400"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={iconInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleIconUpload}
            className="hidden"
          />
          <button
            onClick={() => iconInputRef.current?.click()}
            className="flex-1 px-2 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-200"
          >
            {currentIcon ? 'Replace icon' : 'Upload icon'}
          </button>
          {currentIcon && (
            <img
              src={currentIcon}
              alt="icon preview"
              className="h-8 w-8 object-contain border border-gray-700 rounded bg-gray-950"
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => toggleLock(item.id)}
          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            item.isLocked
              ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/40'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {item.isLocked ? 'Unlock' : 'Lock'}
        </button>
        <button
          onClick={handleDelete}
          title="Delete (or press Delete / Backspace)"
          className="flex-1 px-2 py-1.5 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (embedded) return body;

  return <div className="p-2">{body}</div>;
}
