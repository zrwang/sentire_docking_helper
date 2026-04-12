import { useAppStore, type TabId } from '@/stores/app-store';

const TABS: { id: TabId; label: string; enabled: boolean }[] = [
  { id: 'room', label: 'Room Layout', enabled: true },
  { id: 'robot', label: 'Robot Configuration', enabled: false },
  { id: 'ports', label: 'Port Placement', enabled: false },
];

export function TabNavigation() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="flex bg-gray-800 border-b border-gray-700 shrink-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => tab.enabled && setActiveTab(tab.id)}
          disabled={!tab.enabled}
          className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === tab.id
              ? 'text-white bg-gray-900'
              : tab.enabled
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
                : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          {tab.label}
          {!tab.enabled && (
            <span className="ml-1.5 text-[10px] text-gray-600">(Soon)</span>
          )}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
          )}
        </button>
      ))}
    </nav>
  );
}
