import { useRef, useState } from 'react';
import { useCustomEquipmentStore } from '@/stores/custom-equipment-store';
import { useIconStore } from '@/stores/icon-store';

interface CustomEquipmentModalProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_COLOR = '#8B5CF6';

/**
 * Lets the user define a new equipment type (label, size, colour, optional
 * icon). The entry persists to localStorage and appears in the palette
 * alongside the built-in catalog.
 */
export function CustomEquipmentModal({ open, onClose }: CustomEquipmentModalProps) {
  const addEntry = useCustomEquipmentStore((s) => s.addEntry);
  const setIcon = useIconStore((s) => s.setIcon);

  const [label, setLabel] = useState('');
  const [width, setWidth] = useState(60);
  const [height, setHeight] = useState(60);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [shape, setShape] = useState<'rect' | 'circle'>('rect');
  const [iconDataUrl, setIconDataUrl] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setLabel('');
    setWidth(60);
    setHeight(60);
    setColor(DEFAULT_COLOR);
    setShape('rect');
    setIconDataUrl(null);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setIconDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreate = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const w = Math.max(5, Math.min(1000, Math.round(width)));
    const h = Math.max(5, Math.min(1000, Math.round(height)));
    const type = addEntry({
      label: trimmed,
      dimensions: { width: w, height: h },
      color,
      shape,
    });
    if (iconDataUrl) setIcon(type, iconDataUrl);
    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  const canSubmit = label.trim().length > 0 && width > 0 && height > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md p-4 text-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">New custom equipment</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-white text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Name</label>
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. C-arm fluoroscope"
              className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">
                Width (cm)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={5}
                max={1000}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={5}
                max={1000}
                className="w-full px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-10 bg-gray-800 border border-gray-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Shape</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setShape('rect')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${
                    shape === 'rect'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Rect
                </button>
                <button
                  type="button"
                  onClick={() => setShape('circle')}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium ${
                    shape === 'circle'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Circle
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800">
            <label className="block text-[10px] text-gray-400 mb-1">
              Icon (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={iconInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={handleIconUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => iconInputRef.current?.click()}
                className="flex-1 px-2 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                {iconDataUrl ? 'Replace icon' : 'Upload icon'}
              </button>
              {iconDataUrl && (
                <>
                  <img
                    src={iconDataUrl}
                    alt="icon preview"
                    className="h-8 w-8 object-contain border border-gray-700 rounded bg-gray-950"
                  />
                  <button
                    type="button"
                    onClick={() => setIconDataUrl(null)}
                    className="text-[10px] text-gray-400 hover:text-red-400"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSubmit}
            className="px-3 py-1.5 rounded text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
