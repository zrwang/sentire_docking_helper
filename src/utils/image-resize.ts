/**
 * Downscale a data-URL image to fit inside a max dimension and re-encode it
 * as a compact data URL. Keeps SVGs as-is (they're already small and vector).
 * PNGs with alpha stay PNG; everything else becomes JPEG at moderate quality.
 *
 * This keeps persisted icons small enough to comfortably fit in localStorage
 * across many equipment types (the previous behaviour stored the raw upload,
 * which for multi-MB photos exceeded the ~5MB localStorage quota and silently
 * dropped the save).
 */
export async function downscaleDataUrl(
  dataUrl: string,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<string> {
  const { maxDim = 256, quality = 0.85 } = opts;

  // SVGs don't need resizing -- they're vector and typically tiny.
  if (dataUrl.startsWith('data:image/svg+xml')) return dataUrl;

  const img = await loadImage(dataUrl);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return dataUrl;

  // If already small enough, skip recompression.
  if (iw <= maxDim && ih <= maxDim && dataUrl.length < 50_000) return dataUrl;

  const scale = Math.min(1, maxDim / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);

  // Keep PNG for transparent PNGs, otherwise use JPEG for much smaller files.
  const keepAlpha = dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/webp');
  const mime = keepAlpha ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(mime, quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}
