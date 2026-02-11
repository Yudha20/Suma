import type { ReactNode } from 'react';

export type SegmentedOption<T extends string | number> = {
  value: T;
  label: ReactNode;
};

export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              className={
                'h-10 rounded-lg border text-sm transition duration-150 ' +
                (active
                  ? 'border-accent bg-emerald-500/20 text-emerald-200 shadow-[0_0_10px_rgba(58,212,127,0.35)]'
                  : 'border-consoleEdge bg-black/40 text-slate-300 hover:border-slate-500')
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
