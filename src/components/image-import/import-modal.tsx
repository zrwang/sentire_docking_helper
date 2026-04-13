import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { v4 as uuidv4 } from 'uuid';

/** Inline-styled spinner so it's resilient to CSS class purging / HMR issues. */
function Spinner({ size = 16 }: { size?: number }) {
  return (
    <>
      <style>{`@keyframes sr-spin { to { transform: rotate(360deg); } }`}</style>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '9999px',
          animation: 'sr-spin 0.8s linear infinite',
          verticalAlign: '-2px',
          boxSizing: 'border-box',
        }}
      />
    </>
  );
}
import { useImportStore } from '@/stores/import-store';
import { useRoomStore } from '@/stores/room-store';
import { analyzeFloorPlan } from '@/utils/claude-vision';
import { EQUIPMENT_CATALOG, DEFAULT_ROOM } from '@/constants/room-defaults';
import type { Equipment, Room } from '@/types/room';
import { polygonBoundingBox } from '@/utils/geometry';

/**
 * Read a File into an HTMLImageElement so we can capture natural dimensions
 * AND produce a data URL for both the Claude API and the canvas background.
 */
function readImageFile(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function ImportModal() {
  const {
    isOpen,
    apiKey,
    imageDataUrl,
    imageSize,
    status,
    error,
    result,
    scaleOverride,
    closeImport,
    setApiKey,
    setImage,
    setStatus,
    setError,
    setResult,
    setScaleOverride,
    reset,
  } = useImportStore();

  const { replaceRoom } = useRoomStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showKey, setShowKey] = useState(false);
  // Local mirror of the analyzing state so the spinner paints immediately
  // under flushSync — Zustand updates go through an external subscription
  // and can't be forced to commit the same way.
  const [isAnalyzingLocal, setIsAnalyzingLocal] = useState(false);
  const isAnalyzing = isAnalyzingLocal || status === 'analyzing';

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl, width, height } = await readImageFile(file);
      setImage(dataUrl, { width, height });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleAnalyze = async () => {
    if (!imageDataUrl) {
      setError('Please upload an image first.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please enter your Anthropic API key.');
      return;
    }
    // Flip local state synchronously + flushSync so React paints the
    // spinner before we start any blocking work.
    flushSync(() => {
      setIsAnalyzingLocal(true);
    });
    setStatus('analyzing');
    setError(null);
    console.log('[import] starting Claude vision analysis...');
    const started = performance.now();
    try {
      // Yield one animation frame so the browser actually paints the
      // spinner before we hand control to the network request.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const res = await analyzeFloorPlan(imageDataUrl, apiKey.trim());
      const elapsed = Math.round((performance.now() - started) / 100) / 10;
      console.log(`[import] analysis complete in ${elapsed}s:`, res);
      setResult(res);
    } catch (err) {
      const elapsed = Math.round((performance.now() - started) / 100) / 10;
      console.error(`[import] analysis failed after ${elapsed}s:`, err);
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : JSON.stringify(err);
      setError(msg || 'Analysis failed with no error message.');
    } finally {
      setIsAnalyzingLocal(false);
    }
  };

  const handleApply = () => {
    if (!result || !imageDataUrl || !imageSize) return;

    // Determine scale (cm per pixel). If none, assume the image width maps to
    // DEFAULT_ROOM.width so the plan is at least viewable.
    const metersPerPx = scaleOverride ?? result.scaleMetersPerPixel;
    const cmPerPx = metersPerPx && metersPerPx > 0 ? metersPerPx * 100 : null;

    let scale: number;
    if (cmPerPx) {
      scale = cmPerPx;
    } else {
      scale = DEFAULT_ROOM.width / imageSize.width;
    }

    // Build polygon in cm. If the AI didn't return a usable polygon, fall back
    // to a rectangle covering the whole image.
    const rawPolygon =
      result.roomPolygonPx.length >= 3
        ? result.roomPolygonPx
        : [
            { x: 0, y: 0 },
            { x: imageSize.width, y: 0 },
            { x: imageSize.width, y: imageSize.height },
            { x: 0, y: imageSize.height },
          ];

    const polygonCm = rawPolygon.map((p) => ({ x: p.x * scale, y: p.y * scale }));
    const bbox = polygonBoundingBox(polygonCm);
    const offsetX = bbox.minX;
    const offsetY = bbox.minY;

    const normalizedPolygon = polygonCm.map((p) => ({
      x: p.x - offsetX,
      y: p.y - offsetY,
    }));
    const width = bbox.maxX - bbox.minX;
    const height = bbox.maxY - bbox.minY;

    const isPolygon = result.roomPolygonPx.length >= 3;

    const equipment: Equipment[] = result.equipment.map((e, idx) => {
      const catalog = EQUIPMENT_CATALOG.find((c) => c.type === e.type);

      // Floor-plan diagrams are schematic — icon sizes on the page rarely
      // match the equipment's real footprint. Prefer the catalog's known
      // real-world dimensions for every typed item; only fall back to the
      // AI's pixel measurement for 'generic' (unrecognised) items.
      const aiW = Math.max(5, e.dimensionsPx.width * scale);
      const aiH = Math.max(5, e.dimensionsPx.height * scale);
      const dimensions =
        catalog && catalog.type !== 'generic'
          ? { ...catalog.dimensions }
          : { width: aiW, height: aiH };

      // Anchor on the CENTRE of the AI's detected box so the icon stays in
      // the same visual spot even when its size changes to the catalog value.
      const aiCenterX = (e.positionPx.x + e.dimensionsPx.width / 2) * scale;
      const aiCenterY = (e.positionPx.y + e.dimensionsPx.height / 2) * scale;
      const position = {
        x: aiCenterX - dimensions.width / 2 - offsetX,
        y: aiCenterY - dimensions.height / 2 - offsetY,
      };
      return {
        id: uuidv4(),
        type: e.type,
        label: e.label || catalog?.label || e.type,
        position,
        rotation: e.rotation || 0,
        dimensions,
        isLocked: false,
        color: catalog?.color ?? '#71717A',
        zIndex: idx,
        shape: catalog?.shape ?? 'rect',
      };
    });

    const newRoom: Room = {
      shape: isPolygon ? 'polygon' : 'rectangular',
      width,
      height,
      gridSize: DEFAULT_ROOM.gridSize,
      polygon: isPolygon ? normalizedPolygon : undefined,
      equipment,
      backgroundImage: imageDataUrl,
      backgroundOpacity: 0.35,
    };

    replaceRoom(newRoom);
    reset();
    closeImport();
  };

  const handleClose = () => {
    closeImport();
  };

  const scaleValue = scaleOverride ?? result?.scaleMetersPerPixel ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div>
            <h2 className="text-base font-semibold">Import Floor Plan</h2>
            <p className="text-xs text-gray-400">
              Upload a picture of an OR layout — Claude will extract equipment positions you can then refine.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl leading-none px-2"
            aria-label="Close"
          >
            &times;
          </button>
        </header>

        <div className="p-4 space-y-4">
          {/* API key */}
          <section>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Anthropic API Key
            </label>
            <div className="flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Stored locally in your browser only. Required for image analysis.
            </p>
          </section>

          {/* Image upload */}
          <section>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Floor-plan Image
            </label>
            <div className="flex items-start gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded border border-gray-600"
              >
                {imageDataUrl ? 'Choose different image' : 'Choose image'}
              </button>
              {imageSize && (
                <span className="text-xs text-gray-500 mt-1.5">
                  {imageSize.width} x {imageSize.height}px
                </span>
              )}
            </div>
            {imageDataUrl && (
              <div className="mt-2 border border-gray-700 rounded overflow-hidden bg-gray-950">
                <img
                  src={imageDataUrl}
                  alt="Floor plan preview"
                  className="w-full max-h-64 object-contain"
                />
              </div>
            )}
          </section>

          {/* Analyze */}
          <section className="flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!imageDataUrl || !apiKey || isAnalyzing}
              className={`px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-100 rounded inline-flex items-center gap-2 ${
                isAnalyzing ? 'cursor-wait' : 'disabled:cursor-not-allowed'
              }`}
            >
              {isAnalyzing && (
                <Spinner />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
            </button>
            {isAnalyzing && (
              <span className="text-xs text-gray-400">
                Sending image to Claude — usually 20-60s.
              </span>
            )}
          </section>

          {isAnalyzing && (
            <div className="flex items-center gap-3 px-3 py-2 bg-blue-900/40 border border-blue-700 rounded text-xs text-blue-200">
              <Spinner />
              <span>
                Claude is analyzing your floor plan. This call is synchronous;
                please keep this tab open.
              </span>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 bg-red-900/40 border border-red-700 rounded text-xs text-red-300 whitespace-pre-wrap">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <section className="border border-gray-700 rounded p-3 bg-gray-950/50">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Detection Summary
              </h3>
              <div className="text-xs text-gray-400 space-y-1">
                <div>
                  <span className="text-gray-500">Room polygon:</span>{' '}
                  {result.roomPolygonPx.length >= 3
                    ? `${result.roomPolygonPx.length} vertices`
                    : 'not detected (will use rectangular)'}
                </div>
                <div>
                  <span className="text-gray-500">Equipment found:</span>{' '}
                  {result.equipment.length}
                </div>
                {result.notes && (
                  <div className="text-[11px] text-gray-500 italic mt-1">
                    {result.notes}
                  </div>
                )}
              </div>

              {/* Scale refinement */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Scale (meters per pixel)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={scaleValue ?? ''}
                    onChange={(e) =>
                      setScaleOverride(e.target.value ? Number(e.target.value) : null)
                    }
                    placeholder="e.g. 0.025"
                    className="w-32 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                  />
                  {imageSize && scaleValue && scaleValue > 0 && (
                    <span className="text-[11px] text-gray-500">
                      {'=>'} room bbox ~
                      {Math.round(imageSize.width * scaleValue * 100)} x{' '}
                      {Math.round(imageSize.height * scaleValue * 100)} cm
                    </span>
                  )}
                </div>
                {result.scaleMetersPerPixel == null && !scaleOverride && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    No scale detected. Provide one, or Apply will stretch the plan to
                    the default room width.
                  </p>
                )}
              </div>

              {/* Equipment list preview */}
              {result.equipment.length > 0 && (
                <details className="mt-3" open>
                  <summary className="text-xs text-gray-400 cursor-pointer">
                    Detected items ({result.equipment.length})
                  </summary>
                  <ul className="mt-2 max-h-40 overflow-y-auto text-xs space-y-0.5">
                    {result.equipment.map((e, i) => (
                      <li
                        key={i}
                        className="flex justify-between gap-2 text-gray-400"
                      >
                        <span className="truncate">
                          {e.label}{' '}
                          <span className="text-gray-600">({e.type})</span>
                        </span>
                        <span className="text-gray-600 shrink-0">
                          {Math.round(e.confidence * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700 bg-gray-900/50">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!result}
            className="px-4 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 rounded"
          >
            Apply to Canvas
          </button>
        </footer>
      </div>
    </div>
  );
}
