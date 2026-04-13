import { useRef } from 'react';
import type { EquipmentType } from '@/types/room';
import { EQUIPMENT_CATALOG } from '@/constants/room-defaults';
import { useRoomStore } from '@/stores/room-store';
import { useIconStore } from '@/stores/icon-store';
import {
  useTypeOverridesStore,
  getTypeOverride,
} from '@/stores/type-overrides-store';
import { useCustomEquipmentStore } from '@/stores/custom-equipment-store';

interface TypePropertiesProps {
  type: EquipmentType;
  onClose?: () => void;
}

/**
 * Right-click panel for an equipment *type* (palette entry). Lets the user
 * edit the default dimensions, swap the icon, and reset overrides -- all of
 * which propagate to every existing item of the same type.
 */
export function TypeProperties({ type, onClose }: TypePropertiesProps) {
  const addEquipment = useRoomStore((s) => s.addEquipment);
  const resizeEquipment = useRoomStore((s) => s.resizeEquipment);
  const room = useRoomStore((s) => s.room);
  const setDimensionsOverride = useTypeOverridesStore((s) => s.setDimensions);
  const clearOverride = useTypeOverridesStore((s) => s.clear);
  const icons = useIconStore((s) => s.icons);
  const setIcon = useIconStore((s) => s.setIcon);
  const clearIcon = useIconStore((s) => s.clearIcon);
  const customEntries = useCustomEquipmentStore((s) => s.entries);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const builtIn = EQUIPMENT_CATALOG.find((e) => e.type === type);
  const custom = customEntries.find((e) => e.type === type);
  const base = builtIn ?? custom;

  if (!base) {
    return <div className="text-xs text-gray-500 p-2">Unknown type.</div>;
  }

  const override = getTypeOverride(type);
  const curDims = override?.dimensions ?? base.dimensions;

  const handleAdd = () => {
    addEquipment(type);
    onClose?.();
  };

  const propagateSize = (w: number, h: number) => {
    // If any item of this type is already on the canvas, resizeEquipment
    // will sync them all and persist the override via the store. If not,
    // persist the override directly so the next insert picks it up.
    const existing = room.equipment.find((e) => e.type === type);
    if (existing) {
      resizeEquipment(existing.id, { width: w, height: h });
    } else {
      setDimensionsOverride(type, { width: w, height: h });
    }
  };

  const handleSizeChange = (axis: 'width' | 'height', value: string) => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) return;
    const next = { ...curDims, [axis]: num };
    propagateSize(next.width, next.height);
  };

  const handleResetDefaults = () => {
    clearOverride(type);
    // Also sync any on-canvas items of this type back to the catalog default.
    const existing = room.equipment.find((e) => e.type === type);
    if (existing) {
      resizeEquipment(existing.id, { ...base.dimensions });
    }
  };

  const currentIcon = icons[type];

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;
      setIcon(type, dataUrl);
      // Keep aspect ratio based on the current defaults.
      const img = new Image();
      img.onload = () => {
        const iw = img.naturalWidth || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;
        const ratio = iw / ih;
        const { width: curW, height: curH } = curDims;
        let newW: number;
        let newH: number;
        if (curW >= curH) {
          newW = curW;
          newH = curW / ratio;
        } else {
          newH = curH;
          newW = curH * ratio;
        }
        propagateSize(newW, newH);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="p-2 flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: base.color }}
          />
          <span className="text-sm font-medium text-white">{base.label}</span>
        </div>
        <span className="text-[10px] text-gray-500">
          Default for every "{base.label}" on the canvas
        </span>
      </div>

      <button
        onClick={handleAdd}
        className="px-2 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white"
      >
        Add to canvas
      </button>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Width (cm)</label>
          <input
            type="number"
            value={Math.round(curDims.width)}
            min={5}
            onChange={(e) => handleSizeChange('width', e.target.value)}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-0.5">Height (cm)</label>
          <input
            type="number"
            value={Math.round(curDims.height)}
            min={5}
            onChange={(e) => handleSizeChange('height', e.target.value)}
            className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white"
          />
        </div>
      </div>

      <div className="pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[10px] text-gray-500">Icon</label>
          {currentIcon && (
            <button
              onClick={() => clearIcon(type)}
              className="text-[10px] text-gray-500 hover:text-red-400"
            >
              Clear
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

      <button
        onClick={handleResetDefaults}
        className="px-2 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300"
      >
        Reset to catalog default
      </button>
    </div>
  );
}
