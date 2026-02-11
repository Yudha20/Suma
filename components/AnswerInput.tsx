import { useEffect, useRef } from 'react';

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      ref.current?.focus();
    }
  }, [disabled]);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSubmit();
          }
        }}
        inputMode="numeric"
        disabled={disabled}
        className="h-12 flex-1 rounded-lg border border-consoleEdge bg-black/40 px-3 text-lg text-slate-100 disabled:opacity-60"
        aria-label="Your answer"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="h-12 rounded-lg border border-accent bg-emerald-500/20 px-4 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-60"
      >
        Enter
      </button>
    </div>
  );
}
