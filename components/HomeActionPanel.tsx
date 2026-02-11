import type { ExplainBlock, PhotoStatus, Swatch } from '@/lib/photo/types';
import { PhotoExplainDrawer } from '@/components/PhotoExplainDrawer';
import type { SessionMode } from '@/lib/types';

export function HomeActionPanel({
  onStart,
  onSurprise,
  onPhotoClick,
  isPhotoProcessing,
  photoStatus,
  photoMessage,
  photoCandidates,
  photoSwatches,
  photoExplainability
}: {
  onStart: (mode: SessionMode) => void;
  onSurprise: () => void;
  onPhotoClick: () => void;
  isPhotoProcessing: boolean;
  photoStatus: PhotoStatus;
  photoMessage: string | null;
  photoCandidates: string[];
  photoSwatches: Swatch[];
  photoExplainability: ExplainBlock[];
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onStart('sprint60')}
          className="h-12 rounded-lg border border-accent bg-emerald-500/20 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30"
        >
          Start Sprint (60s)
        </button>
        <button
          type="button"
          onClick={() => onStart('session120')}
          className="h-12 rounded-lg border border-consoleEdge bg-black/50 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
        >
          Start Session (120s)
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSurprise}
          className="h-10 rounded-full border border-consoleEdge px-4 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500"
        >
          Surprise Me
        </button>
        <button
          type="button"
          onClick={onPhotoClick}
          className="h-10 rounded-full border border-consoleEdge px-4 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-slate-500"
        >
          Photo Mode
        </button>
      </div>

      {isPhotoProcessing ? (
        <div className="space-y-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-black/50">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Scanning photo...</p>
        </div>
      ) : null}

      {photoExplainability.length > 0 || photoSwatches.length > 0 || photoCandidates.length > 0 || photoMessage ? (
        <PhotoExplainDrawer
          status={photoStatus}
          message={photoMessage}
          candidates={photoCandidates}
          explainability={photoExplainability}
          swatches={photoSwatches}
        />
      ) : null}
    </>
  );
}
