import type { ChangeEvent } from 'react';

export function SeedInput({
  value,
  onChange,
  note
}: {
  value: string;
  onChange: (value: string) => void;
  note: string | null;
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm uppercase tracking-[0.2em] text-slate-400">
        Number from your day
      </label>
      <input
        value={value}
        onChange={handleChange}
        inputMode="numeric"
        placeholder="Optional seed"
        className="h-12 rounded-lg border border-consoleEdge bg-black/40 px-3 text-lg text-slate-100"
        aria-describedby={note ? 'surprise-note' : undefined}
      />
      {note ? (
        <p id="surprise-note" className="text-xs text-slate-400">
          {note}
        </p>
      ) : null}
    </div>
  );
}
