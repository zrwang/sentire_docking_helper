import { useState } from 'react';
import { EQUIPMENT_CATALOG, HIDDEN_PALETTE_TYPES } from '@/constants/room-defaults';
import { PSR_CONFIGS, PSR_CONFIG_TYPES } from '@/constants/psr-configs';
import { useRoomStore } from '@/stores/room-store';
import { useCustomEquipmentStore } from '@/stores/custom-equipment-store';
import { useIconStore } from '@/stores/icon-store';
import { useContextMenuStore } from '@/stores/context-menu-store';
import {
  usePaletteVisibilityStore,
  PSR_PICKER_TOKEN,
} from '@/stores/palette-visibility-store';
import type { EquipmentType } from '@/types/room';
import { SidePanelSection } from '@/components/layout/side-panel';
import { useListReorder, type ReorderRowProps } from '@/hooks/use-list-reorder';
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
  const deletedTypes = usePaletteVisibilityStore((s) => s.deleted);
  const hideType = usePaletteVisibilityStore((s) => s.hide);
  const unhideType = usePaletteVisibilityStore((s) => s.unhide);
  const markDeleted = usePaletteVisibilityStore((s) => s.markDeleted);
  const undeleteType = usePaletteVisibilityStore((s) => s.undelete);
  const restoreAllHidden = usePaletteVisibilityStore((s) => s.restoreAll);
  const paletteOrder = usePaletteVisibilityStore((s) => s.order);
  const setPaletteOrder = usePaletteVisibilityStore((s) => s.setOrder);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  // Any type in either set is excluded from the main palette.
  const excludedSet = new Set([...hiddenTypes, ...deletedTypes]);

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
    // Drop any dangling "hidden" entry so the store doesn't keep referencing
    // a type that no longer exists.
    unhideType(type);
  };

  // Entries shown as plain rows: skip legacy-hidden types, user-hidden types,
  // and the three PSR variants (they render together in the dedicated picker
  // below). PSR variants that are *all* hidden collapse the whole picker.
  const catalogFiltered = EQUIPMENT_CATALOG.filter(
    (e) =>
      !HIDDEN_PALETTE_TYPES.has(e.type as string) &&
      !excludedSet.has(e.type as string)
  );
  const plainEntries = catalogFiltered.filter(
    (e) => !PSR_TYPE_SET.has(e.type as string)
  );
  const visiblePsrConfigs = PSR_CONFIGS.filter(
    (c) => !excludedSet.has(c.type as string)
  );

  /**
   * Order the main-section rows using the user's saved order when possible,
   * then append anything unlisted in catalog order. The PSR picker is
   * represented by a sentinel token so it moves alongside the built-ins; if
   * the user has never reordered, we default to placing it after the
   * operating table (matching the legacy layout).
   */
  const mainTokens: string[] = (() => {
    const known = new Set<string>(plainEntries.map((e) => e.type as string));
    if (visiblePsrConfigs.length > 0) known.add(PSR_PICKER_TOKEN);
    const ordered = paletteOrder.filter((t) => known.has(t));
    const listed = new Set(ordered);
    const fallback: string[] = [];
    plainEntries.forEach((e) => {
      if (!listed.has(e.type as string)) fallback.push(e.type as string);
      if (
        e.type === 'operating-table' &&
        visiblePsrConfigs.length > 0 &&
        !listed.has(PSR_PICKER_TOKEN)
      ) {
        fallback.push(PSR_PICKER_TOKEN);
      }
    });
    if (visiblePsrConfigs.length > 0 && !listed.has(PSR_PICKER_TOKEN) &&
        !fallback.includes(PSR_PICKER_TOKEN)) {
      fallback.push(PSR_PICKER_TOKEN);
    }
    return [...ordered, ...fallback];
  })();

  const handleReorderMain = (from: number, to: number) => {
    const next = [...mainTokens];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    // Merge with any tokens that weren't in the main list (custom entries,
    // unrelated keys) to avoid clobbering their relative order.
    const mainSet = new Set(mainTokens);
    const preserved = paletteOrder.filter((t) => !mainSet.has(t));
    setPaletteOrder([...next, ...preserved]);
  };

  const customTokens: string[] = (() => {
    const known = new Set(customEntries.map((e) => e.type as string));
    const ordered = paletteOrder.filter((t) => known.has(t));
    const listed = new Set(ordered);
    const fallback = customEntries
      .map((e) => e.type as string)
      .filter((t) => !listed.has(t));
    return [...ordered, ...fallback];
  })();

  const handleReorderCustom = (from: number, to: number) => {
    const next = [...customTokens];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const customSet = new Set(customTokens);
    const preserved = paletteOrder.filter((t) => !customSet.has(t));
    setPaletteOrder([...preserved, ...next]);
  };

  const mainReorder = useListReorder({
    onReorder: handleReorderMain,
    mimeType: 'application/x-sentire-palette-main',
  });
  const customReorder = useListReorder({
    onReorder: handleReorderCustom,
    mimeType: 'application/x-sentire-palette-custom',
  });

  const resolveLabel = (t: string) => {
    const built = EQUIPMENT_CATALOG.find((e) => e.type === t);
    const custom = customEntries.find((e) => e.type === t);
    const entry = built ?? custom;
    if (!entry) return null;
    return {
      type: entry.type as EquipmentType,
      label: entry.label,
      isCustom: !!custom && !built,
    };
  };

  // "Hidden" list -- visible in the collapsible panel with Restore + Delete.
  const hiddenLabels = hiddenTypes
    .map(resolveLabel)
    .filter(
      (x): x is { type: EquipmentType; label: string; isCustom: boolean } =>
        x !== null
    );

  // "Removed" list -- built-in types the user deleted. Custom types get hard-
  // removed immediately so they never land here.
  const deletedLabels = deletedTypes
    .map(resolveLabel)
    .filter(
      (x): x is { type: EquipmentType; label: string; isCustom: boolean } =>
        x !== null
    );

  const handleHide = (e: React.MouseEvent, type: EquipmentType) => {
    e.stopPropagation();
    e.preventDefault();
    hideType(type);
  };

  /**
   * Delete from the Hidden panel. Custom entries are hard-removed from the
   * catalog (their icon is cleaned up too); built-ins can't truly leave the
   * code catalog, so they move into the "Removed" subsection where they stay
   * hidden but remain recoverable.
   */
  const handleDeleteHidden = (type: EquipmentType, label: string, isCustom: boolean) => {
    if (isCustom) {
      handleRemoveCustom(type, label);
      return;
    }
    if (
      !window.confirm(
        `Permanently remove "${label}" from the palette? Use "Reset palette" at the bottom of the Equipment list if you change your mind.`
      )
    ) {
      return;
    }
    markDeleted(type);
  };

  const dragClasses = (dragProps: ReorderRowProps) => {
    const s = dragProps['data-drag-state'];
    return `${s === 'source' ? 'opacity-40' : ''} ${
      s === 'target' ? 'outline outline-1 outline-blue-500/60 bg-gray-800/60' : ''
    }`;
  };

  const renderEntry = (
    entry: (typeof EQUIPMENT_CATALOG)[number],
    dragProps: ReorderRowProps
  ) => (
    <div
      key={entry.type}
      {...dragProps}
      className={`relative flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-800 transition-colors group ${dragClasses(dragProps)}`}
    >
      <span
        className="text-gray-600 group-hover:text-gray-400 text-xs leading-none cursor-grab select-none shrink-0"
        title="Drag to reorder"
        aria-hidden="true"
      >
        ⋮⋮
      </span>
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

  const renderPsrPicker = (dragProps: ReorderRowProps) =>
    visiblePsrConfigs.length === 0 ? null : (
      <div
        key="psr-picker"
        {...dragProps}
        className={`px-2 py-1.5 rounded border border-gray-800 bg-gray-900/40 ${dragClasses(dragProps)}`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1 text-sm text-gray-200">
            <span
              className="text-gray-600 text-xs leading-none cursor-grab select-none"
              title="Drag to reorder"
              aria-hidden="true"
            >
              ⋮⋮
            </span>
            Patient Side Robot
          </span>
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
    <SidePanelSection title="Equipment" storageKey="equipment">
      <div className="flex flex-col gap-1">
        {mainTokens.map((token, i) => {
          const dragProps = mainReorder.getRowProps(i);
          if (token === PSR_PICKER_TOKEN) {
            return renderPsrPicker(dragProps);
          }
          const entry = plainEntries.find((e) => e.type === token);
          if (!entry) return null;
          return renderEntry(entry, dragProps);
        })}

        {customEntries.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-gray-500">
              Custom
            </div>
            {customTokens.map((token, i) => {
              const entry = customEntries.find((e) => e.type === token);
              if (!entry) return null;
              const dragProps = customReorder.getRowProps(i);
              const dStyle = dragClasses(dragProps);
              return (
                <div
                  key={entry.id}
                  {...dragProps}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors group ${dStyle}`}
                >
                  <span
                    className="text-gray-600 group-hover:text-gray-400 text-xs leading-none cursor-grab select-none shrink-0"
                    title="Drag to reorder"
                    aria-hidden="true"
                  >
                    ⋮⋮
                  </span>
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
              );
            })}
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
                    <button
                      onClick={() =>
                        handleDeleteHidden(h.type, h.label, h.isCustom)
                      }
                      title={
                        h.isCustom
                          ? 'Permanently delete this custom equipment'
                          : 'Permanently remove from the palette (use "Reset palette" at the bottom to bring it back)'
                      }
                      className="text-[10px] text-gray-400 hover:text-red-400"
                    >
                      Delete
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

        {deletedLabels.length > 0 && (
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Restore ${deletedLabels.length} deleted built-in item${
                    deletedLabels.length === 1 ? '' : 's'
                  } back into the palette?`
                )
              ) {
                deletedLabels.forEach((d) => undeleteType(d.type));
              }
            }}
            title="Bring back every built-in equipment type you've deleted"
            className="mt-1 px-2 py-0.5 text-[10px] text-gray-600 hover:text-emerald-400 text-left"
          >
            ⟲ Reset palette ({deletedLabels.length} deleted)
          </button>
        )}
      </div>

      <CustomEquipmentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </SidePanelSection>
  );
}
