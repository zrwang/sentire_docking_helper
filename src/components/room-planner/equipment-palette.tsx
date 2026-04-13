import { useState } from 'react';
import { EQUIPMENT_CATALOG, HIDDEN_PALETTE_TYPES } from '@/constants/room-defaults';
import { PSR_CONFIGS, PSR_CONFIG_TYPES } from '@/constants/psr-configs';
import { useRoomStore } from '@/stores/room-store';
import { useCustomEquipmentStore } from '@/stores/custom-equipment-store';
import { useIconStore } from '@/stores/icon-store';
import { useContextMenuStore } from '@/stores/context-menu-store';
import { usePaletteVisibilityStore } from '@/stores/palette-visibility-store';
import type { EquipmentType } from '@/types/room';
import { SidePanelSection } from '@/components/layout/side-panel';
import { CustomEquipmentModal } from './custom-equipment-modal';

const PSR_TYPE_SET = new Set<string>(PSR_CONFIG_TYPES);

export function EquipmentPalette() {
  const addEquipment = useRoomStore((s) => s.addEquipment);
  const customEntries = useCustomEquipmentStore((s) => s.entries);
  const removeCustomEntry = useCustomEquipmentStore((s) => s.removeEntry);
  const icons = useIconStore((s) => s.icons);
  const clearIcon = useIconStore((s) => s.clearIcon);
  const openTypeMenu = useContextMenuStore((s) => s.openTypeMenu);
  const hiddenTypes = usePaletteVisibilityStore((s) => s.hidden);
  const hideType = usePaletteVisibilityStore((s) => s.hide);
  const unhideType = usePaletteVisibilityStore((s) => s.unhide);
  const restoreAllHidden = usePaletteVisibilityStore((s) => s.restoreAll);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  const hiddenSet = new Set(hiddenTypes);

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

  // Entries shown as plain rows: skip legacy-hidden types, user-hidden types,
  // and the three PSR variants (they render together in the dedicated picker
  // below). PSR variants that are *all* hidden collapse the whole picker.
  const catalogFiltered = EQUIPMENT_CATALOG.filter(
    (e) =>
      !HIDDEN_PALETTE_TYPES.has(e.type as string) &&
      !hiddenSet.has(e.type as string)
  );
  const visibleEntries = catalogFiltered.filter(
    (e) => !PSR_TYPE_SET.has(e.type as string)
  );
  const psrPickerIndex = visibleEntries.findIndex((e) => e.type === 'operating-table');
  const visiblePsrConfigs = PSR_CONFIGS.filter(
    (c) => !hiddenSet.has(c.type as string)
  );

  // Names for the "hidden" restore list (includes custom entries too).
  const hiddenLabels: { type: EquipmentType; label: string }[] = hiddenTypes
    .map((t) => {
      const built = EQUIPMENT_CATALOG.find((e) => e.type === t);
      const custom = customEntries.find((e) => e.type === t);
      const entry = built ?? custom;
      return entry
        ? { type: entry.type as EquipmentType, label: entry.label }
        : null;
    })
    .filter((x): x is { type: EquipmentType; label: string } => x !== null);

  const handleHide = (e: React.MouseEvent, type: EquipmentType) => {
    e.stopPropagation();
    e.preventDefault();
    hideType(type);
  };

  const renderEntry = (entry: (typeof EQUIPMENT_CATALOG)[number]) => (
    <div
      key={entry.type}
      className="relative flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800 transition-colors group"
    >
      <button
        onClick={() => handleAdd(entry.type)}
        onContextMenu={(e) => handleContextMenu(e, entry.type)}
        title="Click to add. Right-click to edit defaults."
        className="flex items-center gap-2 flex-1 min-w-0 text-left text-sm text-gray-300"
      >
        {renderSwatch(entry.type, entry.color)}
        <div className="flex flex-col min-w-0">
          <span className="truncate group-hover:text-white">{entry.label}</span>
          <span className="text-[10px] text-gray-500">
            {entry.dimensions.width} x {entry.dimensions.height} cm
          </span>
        </div>
      </button>
      <button
        onClick={(e) => handleHide(e, entry.type)}
        title="Hide this equipment from the palette"
        className="text-[10px] text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      >
        ✕
      </button>
    </div>
  );

  const psrPicker =
    visiblePsrConfigs.length === 0 ? null : (
      <div key="psr-picker" className="px-2 py-1.5 rounded border border-gray-800 bg-gray-900/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-200">Patient Side Robot</span>
          <span className="text-[10px] text-gray-500">pick a config</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {visiblePsrConfigs.map((cfg) => {
            const icon = icons[cfg.type];
            return (
              <div key={cfg.type} className="relative group">
                <button
                  onClick={() => handleAdd(cfg.type)}
                  onContextMenu={(e) => handleContextMenu(e, cfg.type)}
                  title={`${cfg.description} Click to add; right-click to edit defaults.`}
                  className="flex flex-col items-center gap-1 w-full px-1 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-200"
                >
                  {icon ? (
                    <img src={icon} alt="" className="w-6 h-6 object-contain" />
                  ) : (
                    <div
                      className="w-6 h-4 rounded-sm"
                      style={{ backgroundColor: cfg.color, opacity: 0.8 }}
                    />
                  )}
                  <span className="text-[10px] font-medium">{cfg.shortLabel}</span>
                </button>
                <button
                  onClick={(e) => handleHide(e, cfg.type)}
                  title="Hide this config from the palette"
                  className="absolute top-0 right-0 px-1 text-[10px] text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );

  return (
    <SidePanelSection title="Equipment">
      <div className="flex flex-col gap-1">
        {visibleEntries.flatMap((entry, i) => {
          // Insert the PSR picker right after the operating table so the
          // robot group appears next to the core surgical equipment.
          const row = renderEntry(entry);
          return i === psrPickerIndex ? [row, psrPicker] : [row];
        })}

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

        {hiddenLabels.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <button
              onClick={() => setShowHiddenPanel((v) => !v)}
              className="w-full flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-wider text-gray-500 hover:text-gray-300"
            >
              <span>Hidden ({hiddenLabels.length})</span>
              <span>{showHiddenPanel ? '−' : '+'}</span>
            </button>
            {showHiddenPanel && (
              <div className="flex flex-col gap-0.5 mt-1">
                {hiddenLabels.map((h) => (
                  <div
                    key={h.type}
                    className="flex items-center gap-2 px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-800"
                  >
                    <span className="flex-1 truncate">{h.label}</span>
                    <button
                      onClick={() => unhideType(h.type)}
                      title="Show in palette"
                      className="text-[10px] text-gray-400 hover:text-emerald-400"
                    >
                      Restore
                    </button>
                  </div>
                ))}
                {hiddenLabels.length > 1 && (
                  <button
                    onClick={restoreAllHidden}
                    className="px-2 py-1 mt-1 text-[10px] text-gray-500 hover:text-emerald-400 text-left"
                  >
                    Restore all
                  </button>
                )}
              </div>
            )}
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
