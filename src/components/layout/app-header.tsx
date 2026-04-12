import { useAppStore } from '@/stores/app-store';
import { useRoomStore } from '@/stores/room-store';
import { MIN_ROOM_SIZE, MAX_ROOM_SIZE } from '@/constants/room-defaults';

export function AppHeader() {
  const { snapEnabled, gridVisible, toggleSnap, toggleGrid } = useAppStore();
  const { room, setRoomDimensions } = useRoomStore();

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, Number(e.target.value)));
    setRoomDimensions(val, room.height);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, Number(e.target.value)));
    setRoomDimensions(room.width, val);
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white border-b border-gray-700 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">
          Surgical Room Planner
        </h1>
        <span className="text-xs text-gray-400">da Vinci X</span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <label className="text-gray-400">Room:</label>
          <input
            type="number"
            value={room.width}
            onChange={handleWidthChange}
            className="w-16 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-white text-center"
            min={MIN_ROOM_SIZE}
            max={MAX_ROOM_SIZE}
          />
          <span className="text-gray-500">x</span>
          <input
            type="number"
            value={room.height}
            onChange={handleHeightChange}
            className="w-16 px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-white text-center"
            min={MIN_ROOM_SIZE}
            max={MAX_ROOM_SIZE}
          />
          <span className="text-gray-500">cm</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleGrid}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              gridVisible
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Grid
          </button>
          <button
            onClick={toggleSnap}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              snapEnabled
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            Snap
          </button>
        </div>
      </div>
    </header>
  );
}
