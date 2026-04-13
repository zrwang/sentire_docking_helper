import { useState } from 'react';
import { EQUIPMENT_CATALOG } from '@/constants/room-defaults';
import { useRoomStore } from '@/stores/room-store';
import { useCustomEquipmentStore } from '@/stores/custom-equipment-store';
import { useIconStore } from '@/stores/icon-store';
import { useContextMenuStore } from '@/stores/context-menu-store';
import type { EquipmentType } from '@/types/room';
import { SidePanelSection } from '@/components/layout/side-panel';
import { CustomEquipmentModal } from './custom-equipment-modal';

export function EquipmentPalette() {
  const addEquipment = useRoomStore((s) => s.addEquipment);
  const customEntries = useCustomEquipmentStore((s) => s.entries);
  const removeCustomEntry = useCustomEquipmentStore((s) => s.removeEntry);
  const icons = useIconStore((s) => s.icons);
  const clearIcon = useIconStore((s) => s.clearIcon);
  const openTypeMenu = useContextMenuStore((s) => s.openTypeMenu);
  const [modalOpen, setModalOpen] = useState(false);

  /**
   * Render either the uploaded icon (if any) or the default colored swatch
   * so the palette entry matches what the user sees on the canvas.
   */
  const renderSwatch = (type: EquipmentType, color: string) => {
    const icon = icons[type];
    if (icon) {
      return (
        <img
          src={icon}
          alt=""
          className="w-4 h-4 object-contain shrink-0"
        />
      );
    }
    return (
      <div
        className="w-4 h-3 rounded-sm shrink-0"
        style={{ backgroundColor: color, opacity: 0.7 }}
      />
    );
  };

  const handleAdd = (type: EquipmentType) => {
    addEquipment(type);
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    type: EquipmentType
  ) => {
    e.preventDefault();
    openTypeMenu(type, e.clientX, e.clientY);
  };

  const handleRemoveCustom = (type: EquipmentType, label: string) => {
    if (
      !window.confirm(
        `Delete custom equipment "${label}"? Instances already placed in the room are kept.`
      )
    ) {
      return;
    }
    removeCustomEntry(type);
    clearIcon(type);
  };

  return (
    <SidePanelSection title="Equipment">
      <div className="flex flex-col gap-1">
        {EQUIPMENT_CATALOG.map((entry) => (
          <button
            key={entry.type}
            onClick={() => handleAdd(entry.type)}
            onContextMenu={(e) => handleContextMenu(e, entry.type)}
            title="Click to add. Right-click to edit defaults."
            className="flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors group"
          >
            {renderSwatch(entry.type, entry.color)}
            <div className="flex flex-col min-w-0">
              <span className="truncate group-hover:text-white">
                {entry.label}
              </span>
              <span className="text-[10px] text-gray-500">
                {entry.dimensions.width} x {entry.dimensions.height} cm
              </span>
            </div>
          </button>
        ))}

        {customEntries.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-gray-500">
              Custom
            </div>
            {customEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors group"
              >
                <button
                  onClick={() => handleAdd(entry.type)}
                  onContextMenu={(e) => handleContextMenu(e, entry.type)}
                  title="Click to add. Right-click to edit defaults."
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  {renderSwatch(entry.type, entry.color)}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate group-hover:text-white">
                      {entry.label}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {entry.dimensions.width} x {entry.dimensions.height} cm
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handleRemoveCustom(entry.type, entry.label)}
                  title="Delete this custom equipment type"
                  className="text-[10px] text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setModalOpen(true)}
          className="mt-2 px-2 py-1.5 rounded border border-dashed border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500"
        >
          + Add custom equipment
        </button>
      </div>

      <CustomEquipmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </SidePanelSection>
  );
}
