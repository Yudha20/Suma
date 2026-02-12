import { useEffect, useRef } from 'react';

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  disabled,
  feedback
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  feedback?: 'idle' | 'correct' | 'wrong';
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      ref.current?.focus();
    }
  }, [disabled]);

  const feedbackClass =
    feedback === 'correct'
      ? 'suma-feedback-correct'
      : feedback === 'wrong'
        ? 'suma-feedback-wrong'
        : '';

  return (
    <div className={`flex items-center gap-2 ${feedbackClass}`}>
      <span className="a11y-sr" aria-live="polite">
        {feedback === 'correct' ? 'Correct.' : feedback === 'wrong' ? 'Incorrect.' : ''}
      </span>
      <div className="neu-inset flex-1">
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
          className="h-12 w-full rounded-field bg-transparent px-4 text-lg text-text disabled:opacity-60 outline-none"
          aria-label="Your answer"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="neu-btn-primary disabled:opacity-60"
      >
        Enter
      </button>
    </div>
  );
}
