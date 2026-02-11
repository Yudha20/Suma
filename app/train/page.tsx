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
    currentFixIndex
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
        <ConsoleCard>
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">No active session</h2>
            <p className="text-sm text-slate-400">Start a Sprint or Session from the home console.</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="h-10 w-fit rounded-lg border border-consoleEdge px-4 text-sm text-slate-200"
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
        <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Train</div>
        <div className="text-lg font-semibold text-slate-100 geist-mono">
          {minutes}:{seconds}
        </div>
      </div>

      <ConsoleCard>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
            <span>{session.mode === 'sprint60' ? 'Sprint 60s' : 'Session 120s'}</span>
            <span>Seed {session.seed}</span>
          </div>
          {session.fixTotal > 0 ? (
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">
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
          />

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Enter to submit</span>
            <button
              type="button"
              onClick={handleExit}
              className="rounded-full border border-consoleEdge px-3 py-1 text-xs uppercase tracking-[0.2em]"
            >
              Exit
            </button>
          </div>
        </div>
      </ConsoleCard>

      {showSummary && summary ? (
        <ConsoleCard>
          <SessionSummary summary={summary} />
        </ConsoleCard>
      ) : null}
    </ConsoleShell>
  );
}
