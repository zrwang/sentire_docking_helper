import { AppHeader } from '@/components/layout/app-header';
import { TabNavigation } from '@/components/layout/tab-navigation';
import { SidePanel } from '@/components/layout/side-panel';
import { EquipmentPalette } from '@/components/room-planner/equipment-palette';
import { RoomCanvas } from '@/components/room-planner/room-canvas';
import { ContextMenuHost } from '@/components/room-planner/context-menu-host';
import { ImportModal } from '@/components/image-import/import-modal';
import { useAppStore } from '@/stores/app-store';
import { useDeleteShortcut } from '@/hooks/use-delete-shortcut';

function RoomTab() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <SidePanel>
        <EquipmentPalette />
      </SidePanel>
      <RoomCanvas />
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-400 mb-2">{title}</h2>
        <p className="text-sm text-gray-600">Coming in the next phase.</p>
      </div>
    </div>
  );
}

export default function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  useDeleteShortcut();

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <AppHeader />
      <TabNavigation />
      <main className="flex flex-1 overflow-hidden">
        {activeTab === 'room' && <RoomTab />}
        {activeTab === 'robot' && (
          <PlaceholderTab title="Robot Configuration" />
        )}
        {activeTab === 'ports' && <PlaceholderTab title="Port Placement" />}
      </main>
      <ImportModal />
      <ContextMenuHost />
    </div>
  );
}
