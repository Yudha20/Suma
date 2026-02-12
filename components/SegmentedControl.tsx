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
      <span className="neu-label">{label}</span>
      <div className="neu-segment-rail">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              data-active={active}
              className="neu-segment"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
