import type { SessionSummary } from '@/lib/types';

export function SessionSummary({ summary }: { summary: SessionSummary }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="neu-label">Session Summary</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="neu-inset p-4">
          <div className="neu-label text-[10px]">Score</div>
          <div className="mt-1 text-2xl font-semibold text-text geist-mono">
            {summary.correct}/{summary.total}
          </div>
        </div>
        <div className="neu-inset p-4">
          <div className="neu-label text-[10px]">Accuracy</div>
          <div className="mt-1 text-2xl font-semibold text-text geist-mono">
            {Math.round(summary.accuracy * 100)}%
          </div>
        </div>
        <div className="neu-inset p-4">
          <div className="neu-label text-[10px]">Avg Time</div>
          <div className="mt-1 text-2xl font-semibold text-text geist-mono">
            {(summary.avgTimeMs / 1000).toFixed(1)}s
          </div>
        </div>
      </div>
    </div>
  );
}
