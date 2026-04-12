import { EQUIPMENT_CATALOG } from '@/constants/room-defaults';
import { useRoomStore } from '@/stores/room-store';
import type { EquipmentType } from '@/types/room';
import { SidePanelSection } from '@/components/layout/side-panel';

export function EquipmentPalette() {
  const addEquipment = useRoomStore((s) => s.addEquipment);

  const handleAdd = (type: EquipmentType) => {
    addEquipment(type);
  };

  return (
    <SidePanelSection title="Equipment">
      <div className="flex flex-col gap-1">
        {EQUIPMENT_CATALOG.map((entry) => (
          <button
            key={entry.type}
            onClick={() => handleAdd(entry.type)}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm text-gray-300 hover:bg-gray-800 transition-colors group"
          >
            <div
              className="w-4 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: entry.color, opacity: 0.7 }}
            />
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
      </div>
    </SidePanelSection>
  );
}
