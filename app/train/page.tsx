'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConsoleShell } from '@/components/ConsoleShell';
import { ConsoleCard } from '@/components/ConsoleCard';
import { PromptDisplay } from '@/components/PromptDisplay';
import { AnswerInput } from '@/components/AnswerInput';
import { SessionSummary } from '@/components/SessionSummary';
import { useTrainController } from '@/lib/hooks/useTrainController';

export default function TrainPage() {
  const router = useRouter();
  const {
    session,
    answer,
    setAnswer,
    handleSubmit,
    handleExit,
    summary,
    showSummary,
    currentFixIndex,
    feedback
  } = useTrainController();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleExit]);

  if (!session || !session.currentQuestion) {
    return (
      <ConsoleShell>
        <ConsoleCard variant="flat">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-text">No active session</h2>
            <p className="text-sm text-text-muted">Start a Sprint or Session from the home console.</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="neu-btn-secondary w-fit"
            >
              Back to Home
            </button>
          </div>
        </ConsoleCard>
      </ConsoleShell>
    );
  }

  const minutes = Math.floor(session.timeLeftMs / 1000 / 60);
  const seconds = Math.floor((session.timeLeftMs / 1000) % 60)
    .toString()
    .padStart(2, '0');

  return (
    <ConsoleShell>
      <div className="flex items-center justify-between">
        <div className="neu-label">Train</div>
        <div className="text-lg font-semibold text-text geist-mono">
          {minutes}:{seconds}
        </div>
      </div>

      <ConsoleCard variant="flat">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 neu-label">
            <span>{session.mode === 'sprint60' ? 'Sprint 60s' : 'Session 120s'}</span>
            <span>Seed {session.seed}</span>
          </div>
          {session.fixTotal > 0 ? (
            <div className="neu-label text-text-muted">
              Fix My Misses{' '}
              <span className="geist-mono">
                {Math.min(currentFixIndex, session.fixTotal)}/{session.fixTotal}
              </span>
            </div>
          ) : null}

          <PromptDisplay prompt={session.currentQuestion.prompt} />

          <AnswerInput
            value={answer}
            onChange={setAnswer}
            onSubmit={handleSubmit}
            disabled={showSummary}
            feedback={feedback}
          />

          <div className="flex items-center justify-between text-xs text-text-dim">
            <span>Auto-submits after pause (Enter also works)</span>
            <button
              type="button"
              onClick={handleExit}
              className="neu-btn-secondary"
            >
              Exit
            </button>
          </div>
        </div>
      </ConsoleCard>

      {showSummary && summary ? (
        <ConsoleCard variant="flat">
          <SessionSummary summary={summary} />
        </ConsoleCard>
      ) : null}
    </ConsoleShell>
  );
}
