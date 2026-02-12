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
      <label className="neu-label">
        Number from your day
      </label>
      <div className="neu-inset">
        <input
          value={value}
          onChange={handleChange}
          inputMode="numeric"
          placeholder="Optional seed"
          className="h-12 w-full rounded-field bg-transparent px-4 text-lg text-text placeholder:text-text-dim outline-none"
          aria-describedby={note ? 'surprise-note' : undefined}
        />
      </div>
      {note ? (
        <p id="surprise-note" className="text-xs text-text-muted">
          {note}
        </p>
      ) : null}
    </div>
  );
}
