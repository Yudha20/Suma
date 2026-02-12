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
  const activeIndex = options.findIndex((o) => o.value === value);

  return (
    <div className="flex flex-col gap-2">
      <span className="neu-label">{label}</span>
      <div className="neu-segment-rail">
        {/* Sliding indicator — glides to active segment with spring physics */}
        <div
          className="neu-segment-indicator"
          style={{
            width: `calc((100% - 8px) / ${options.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
          aria-hidden="true"
        />
        {options.map((option, index) => {
          const active = option.value === value;
          const hideSeam =
            index > 0 && (index === activeIndex || index === activeIndex + 1);
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              data-active={active}
              data-hide-seam={hideSeam || undefined}
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
