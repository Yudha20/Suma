import type { SessionSummary } from '@/lib/types';

export function SessionSummary({ summary }: { summary: SessionSummary }) {
  return (
    <div className="rounded-lg border border-consoleEdge bg-black/60 p-5">
      <h2 className="text-sm uppercase tracking-[0.2em] text-slate-400">Session Summary</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs text-slate-400">Score</div>
          <div className="text-2xl font-semibold text-slate-100 geist-mono">
            {summary.correct}/{summary.total}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Accuracy</div>
          <div className="text-2xl font-semibold text-slate-100 geist-mono">
            {Math.round(summary.accuracy * 100)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Avg Time</div>
          <div className="text-2xl font-semibold text-slate-100 geist-mono">
            {(summary.avgTimeMs / 1000).toFixed(1)}s
          </div>
        </div>
      </div>
    </div>
  );
}
