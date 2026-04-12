import type { ReactNode } from 'react';

interface SidePanelProps {
  children: ReactNode;
}

export function SidePanel({ children }: SidePanelProps) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col overflow-y-auto shrink-0">
      {children}
    </aside>
  );
}

interface SidePanelSectionProps {
  title: string;
  children: ReactNode;
}

export function SidePanelSection({ title, children }: SidePanelSectionProps) {
  return (
    <div className="border-b border-gray-700">
      <h3 className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-800/50">
        {title}
      </h3>
      <div className="p-3">{children}</div>
    </div>
  );
}
