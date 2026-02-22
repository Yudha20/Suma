export function HelpControls({
  onHint,
  onReveal,
  hintUsed,
  revealsUsed,
  maxReveals,
  disabled
}: {
  onHint: () => void;
  onReveal: () => void;
  hintUsed: boolean;
  revealsUsed: number;
  maxReveals: number | null;
  disabled?: boolean;
}) {
  const revealRemaining = maxReveals === null ? null : Math.max(0, maxReveals - revealsUsed);
  const revealDisabled = disabled || (revealRemaining !== null && revealRemaining <= 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-dim">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="neu-btn-secondary"
          onClick={() => {
            if (disabled) return;
            onHint();
          }}
          disabled={disabled || hintUsed}
        >
          {hintUsed ? 'Hint shown' : 'Hint'}
        </button>
        <button
          type="button"
          className="neu-btn-secondary"
          onClick={onReveal}
          disabled={revealDisabled}
        >
          Reveal{revealRemaining !== null ? ` (${revealRemaining})` : ''}
        </button>
      </div>
      <div className="text-[10px] uppercase tracking-[0.24em] text-text-muted">
        Hint used: {hintUsed ? 'yes' : 'no'}
      </div>
    </div>
  );
}
