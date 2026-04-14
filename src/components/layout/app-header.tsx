import { useAppStore } from '@/stores/app-store';
import { useRoomStore } from '@/stores/room-store';
import { useImportStore } from '@/stores/import-store';
import { useLayoutsStore } from '@/stores/layouts-store';
import { MIN_ROOM_SIZE, MAX_ROOM_SIZE } from '@/constants/room-defaults';
import { createPartialNephrectomyPreset } from '@/constants/preset-layouts';
import { LayoutsMenu } from './layouts-menu';
import { useHistoryStore } from '@/stores/history-store';
import { undo, redo } from '@/hooks/use-history';

export function AppHeader() {
  const { snapEnabled, gridVisible, toggleSnap, toggleGrid, selectEquipment, contourEditMode, setContourEditMode, bgAdjustMode, setBgAdjustMode, bgCalibrationMode, setBgCalibrationMode, canvasExporter } = useAppStore();
  const { room, setRoomDimensions, setBackgroundOpacity, setBackgroundImage, setBackgroundTransform, replaceRoom, convertRectToPolygon } = useRoomStore();
  const openImport = useImportStore((s) => s.openImport);
  const demoName = useLayoutsStore((s) => s.demoName);
  const demoLayout = useLayoutsStore((s) =>
    s.demoName ? s.layouts[s.demoName] : undefined
  );
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  const handleToggleContourEdit = () => {
    if (!contourEditMode) {
      // Entering edit mode -- make sure we have a polygon to edit.
      if (room.shape !== 'polygon' || !room.polygon) {
        convertRectToPolygon();
      }
      setContourEditMode(true);
    } else {
      // ContourEditor.unmount normalizes + pans the camera; we just flip the
      // mode off here.
      setContourEditMode(false);
    }
  };

  const handleLoadDemo = () => {
    // Prefer the user-pinned saved layout if one exists; fall back to the
    // built-in Partial Nephrectomy preset otherwise.
    const pinned = demoLayout;
    const demoLabel = pinned ? pinned.name : 'Partial Nephrectomy';
    if (
      room.equipment.length > 0 &&
      !window.confirm(
        `Load the demo "${demoLabel}" layout? This will replace the current room.`
      )
    ) {
      return;
    }
    selectEquipment(null);
    replaceRoom(pinned ? pinned.room : createPartialNephrectomyPreset());
  };

  const handleExport = (format: 'png' | 'jpeg') => {
    if (!canvasExporter) return;
    // Briefly deselect + turn off edit modes so the snapshot is clean (no
    // selection rings, no corner resize handles, no adjust overlay).
    selectEquipment(null);
    if (contourEditMode) setContourEditMode(false);
    if (bgAdjustMode) setBgAdjustMode(false);
    // Defer one frame so React + Konva have committed the hidden-handle state.
    requestAnimationFrame(() => {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvasExporter({ mimeType, quality: 0.92 });
      if (!dataUrl) return;
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.download = `room-layout-${stamp}.${format === 'png' ? 'png' : 'jpg'}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, Number(e.target.value)));
    setRoomDimensions(val, room.height);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(MIN_ROOM_SIZE, Math.min(MAX_ROOM_SIZE, Number(e.target.value)));
    setRoomDimensions(room.width, val);
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-2 bg-gray-900 text-white border-b border-gray-700 shrink-0 whitespace-nowrap">
      <div className="flex items-center gap-3 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          Surgical Room Planner
        </h1>
        <span className="text-xs text-gray-400">Sentire C1000</span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
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

        {room.backgroundImage && (
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-xs">BG:</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={room.backgroundOpacity ?? 0.35}
              onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
              className="w-20"
            />
            <button
              onClick={() => setBgAdjustMode(!bgAdjustMode)}
              title={
                bgAdjustMode
                  ? 'Finish adjusting the background image'
                  : 'Drag the image to move it and its corner handle to resize (aspect ratio is preserved)'
              }
              className={`px-2 py-0.5 text-xs rounded ${
                bgAdjustMode
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {bgAdjustMode ? 'Done' : 'Adjust'}
            </button>
            <button
              onClick={() => setBgCalibrationMode(!bgCalibrationMode)}
              title="Rescale the picture by clicking two points that are 1 m apart in the real world"
              className={`px-2 py-0.5 text-xs rounded ${
                bgCalibrationMode
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {bgCalibrationMode ? 'Cancel' : 'Calibrate (1 m)'}
            </button>
            <button
              onClick={() => {
                setBackgroundTransform({
                  x: undefined,
                  y: undefined,
                  width: undefined,
                  height: undefined,
                });
              }}
              title="Reset the background back to filling the room"
              className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              Fit
            </button>
            <button
              onClick={() => {
                setBgAdjustMode(false);
                setBackgroundImage(undefined);
              }}
              className="px-2 py-0.5 text-xs bg-gray-700 hover:bg-gray-600 rounded"
              title="Remove background image"
            >
              Clear
            </button>
          </div>
        )}

        <div className="flex items-center">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl/Cmd+Z)"
            className="px-2 py-1 text-xs font-medium bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-l"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl/Cmd+Shift+Z)"
            className="px-2 py-1 text-xs font-medium bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded-r border-l border-gray-800"
          >
            Redo
          </button>
        </div>

        <button
          onClick={openImport}
          className="px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded"
        >
          Import Plan
        </button>

        <div className="flex items-center">
          <button
            onClick={() => handleExport('png')}
            title="Download the current canvas as a PNG file"
            className="px-2.5 py-1 text-xs font-medium bg-slate-600 hover:bg-slate-500 rounded-l"
          >
            Export PNG
          </button>
          <button
            onClick={() => handleExport('jpeg')}
            title="Download the current canvas as a JPG file"
            className="px-2 py-1 text-xs font-medium bg-slate-600 hover:bg-slate-500 rounded-r border-l border-slate-700"
          >
            JPG
          </button>
        </div>

        <button
          onClick={handleLoadDemo}
          title={
            demoName
              ? `Load the pinned demo layout: "${demoName}"`
              : 'Load the built-in Partial Nephrectomy OR layout. Pin any saved layout as the demo from the Layouts menu.'
          }
          className="px-2.5 py-1 text-xs font-medium bg-teal-700 hover:bg-teal-600 rounded"
        >
          Load Demo
          {demoName && (
            <span className="ml-1 text-[10px] text-teal-200">
              ★
            </span>
          )}
        </button>

        <LayoutsMenu />

        <button
          onClick={handleToggleContourEdit}
          title="Reshape the OR walls: drag a vertex, click an edge midpoint to add one, double-click (or right-click / Alt+click) a vertex to delete"
          className={`px-2.5 py-1 text-xs font-medium rounded ${
            contourEditMode
              ? 'bg-amber-500 text-black hover:bg-amber-400'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {contourEditMode ? 'Done Editing' : 'Edit Contour'}
        </button>

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
