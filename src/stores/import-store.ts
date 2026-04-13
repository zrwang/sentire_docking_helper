import { create } from 'zustand';
import type { DetectionResult } from '@/utils/claude-vision';

const API_KEY_STORAGE = 'sentire.anthropicApiKey';

function loadApiKey(): string {
  try {
    return localStorage.getItem(API_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

function saveApiKey(key: string) {
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    // ignore (private mode, etc.)
  }
}

export type ImportStatus = 'idle' | 'analyzing' | 'ready' | 'error';

interface ImportState {
  isOpen: boolean;
  apiKey: string;
  /** Uploaded image as a data URL. */
  imageDataUrl: string | null;
  /** Natural pixel dimensions of the uploaded image (once loaded). */
  imageSize: { width: number; height: number } | null;
  status: ImportStatus;
  error: string | null;
  result: DetectionResult | null;
  /** User-refined scale (meters per pixel). Overrides AI's estimate. */
  scaleOverride: number | null;

  openImport: () => void;
  closeImport: () => void;
  setApiKey: (key: string) => void;
  setImage: (dataUrl: string | null, size: { width: number; height: number } | null) => void;
  setStatus: (status: ImportStatus) => void;
  setError: (error: string | null) => void;
  setResult: (result: DetectionResult | null) => void;
  setScaleOverride: (scale: number | null) => void;
  reset: () => void;
}

export const useImportStore = create<ImportState>((set) => ({
  isOpen: false,
  apiKey: loadApiKey(),
  imageDataUrl: null,
  imageSize: null,
  status: 'idle',
  error: null,
  result: null,
  scaleOverride: null,

  openImport: () => set({ isOpen: true }),
  closeImport: () => set({ isOpen: false }),
  setApiKey: (key) => {
    saveApiKey(key);
    set({ apiKey: key });
  },
  setImage: (dataUrl, size) =>
    set({
      imageDataUrl: dataUrl,
      imageSize: size,
      status: 'idle',
      error: null,
      result: null,
      scaleOverride: null,
    }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  setResult: (result) =>
    set({
      result,
      status: result ? 'ready' : 'idle',
      scaleOverride: result?.scaleMetersPerPixel ?? null,
    }),
  setScaleOverride: (scale) => set({ scaleOverride: scale }),
  reset: () =>
    set({
      imageDataUrl: null,
      imageSize: null,
      status: 'idle',
      error: null,
      result: null,
      scaleOverride: null,
    }),
}));
