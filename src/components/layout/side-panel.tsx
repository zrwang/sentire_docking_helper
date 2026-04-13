import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SidePanelProps {
  children: ReactNode;
}

const WIDTH_STORAGE_KEY = 'sentire.sidebarWidth.v1';
const DEFAULT_WIDTH = 256; // px (matches the old w-64 Tailwind class)
const MIN_WIDTH = 180;
const MAX_WIDTH = 520;

function loadWidth(): number {
  try {
    const raw = localStorage.getItem(WIDTH_STORAGE_KEY);
    const n = raw ? Number(raw) : NaN;
    if (Number.isFinite(n) && n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_WIDTH;
}

/**
 * Resizable sidebar container. A 4px-wide grab handle on the right edge lets
 * the user drag to resize; the chosen width persists to localStorage so it
 * survives reloads. Width is clamped between MIN_WIDTH and MAX_WIDTH.
 */
export function SidePanel({ children }: SidePanelProps) {
  const [width, setWidth] = useState<number>(loadWidth);
  const draggingRef = useRef(false);

  // Persist width once dragging stops.
  useEffect(() => {
    if (draggingRef.current) return;
    try {
      localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
    } catch {
      /* ignore */
    }
  }, [width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    const startX = e.clientX;
    const startWidth = width;
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const next = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, startWidth + delta)
      );
      setWidth(next);
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // Trigger the effect-based persist with the final width.
      setWidth((w) => w);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <aside
      className="relative bg-gray-900 border-r border-gray-700 flex flex-col overflow-y-auto shrink-0"
      style={{ width }}
    >
      {children}
      {/* Drag handle on the right edge */}
      <div
        onMouseDown={handleMouseDown}
        title="Drag to resize sidebar"
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors"
      />
    </aside>
  );
}

interface SidePanelSectionProps {
  title: string;
  children: ReactNode;
  /** A unique key used to persist the open/closed state across reloads. */
  storageKey?: string;
  /** When storageKey isn't provided, controls the initial open state. */
  defaultOpen?: boolean;
}

/**
 * Collapsible sidebar section. Clicking the header toggles visibility of the
 * body; the state optionally persists to localStorage via `storageKey` so the
 * user's preference survives reloads.
 */
export function SidePanelSection({
  title,
  children,
  storageKey,
  defaultOpen = true,
}: SidePanelSectionProps) {
  const [open, setOpen] = useState<boolean>(() => {
    if (!storageKey) return defaultOpen;
    try {
      const raw = localStorage.getItem(`sentire.section.${storageKey}`);
      if (raw === '0') return false;
      if (raw === '1') return true;
    } catch {
      /* ignore */
    }
    return defaultOpen;
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (storageKey) {
      try {
        localStorage.setItem(`sentire.section.${storageKey}`, next ? '1' : '0');
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="border-b border-gray-700">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-800/50 hover:bg-gray-800 text-left"
      >
        <span>{title}</span>
        <span
          className="text-gray-500 text-sm leading-none"
          aria-hidden="true"
        >
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}
