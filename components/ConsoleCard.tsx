import type { ReactNode } from 'react';

export function ConsoleCard({
  children,
  variant = 'raised'
}: {
  children: ReactNode;
  variant?: 'raised' | 'flat';
}) {
  return (
    <div
      className={
        'p-8 ' +
        (variant === 'flat' ? 'neu-capsule-flat' : 'neu-capsule')
      }
    >
      {children}
    </div>
  );
}
