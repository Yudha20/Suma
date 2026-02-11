import type { ReactNode } from 'react';

export function ConsoleCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-console border border-consoleEdge bg-consoleCard p-6 shadow-console">
      {children}
    </div>
  );
}
