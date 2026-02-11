import type { ReactNode } from 'react';

export function ConsoleShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
