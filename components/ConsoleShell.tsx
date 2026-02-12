import type { ReactNode } from 'react';

export function ConsoleShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg0 px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[840px] flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
