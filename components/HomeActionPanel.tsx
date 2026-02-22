import { useRef } from 'react';
import type { ExplainBlock, PhotoStatus, Swatch } from '@/lib/photo/types';
import { PhotoExplainDrawer } from '@/components/PhotoExplainDrawer';
import type { SessionMode } from '@/lib/types';

export function HomeActionPanel({
  onStart,
  onFix,
  fixCount,
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
  onFix: () => void;
  fixCount: number;
  onSurprise: () => void;
  onPhotoClick: () => void;
  isPhotoProcessing: boolean;
  photoStatus: PhotoStatus;
  photoMessage: string | null;
  photoCandidates: string[];
  photoSwatches: Swatch[];
  photoExplainability: ExplainBlock[];
}) {
  const lastHapticAtRef = useRef(0);

  const triggerHaptic = (durationMs = 14) => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return;
    }
    const now = performance.now();
    if (now - lastHapticAtRef.current < 55) {
      return;
    }
    lastHapticAtRef.current = now;
    navigator.vibrate(durationMs);
  };

  const handleStart = (mode: SessionMode) => {
    triggerHaptic();
    onStart(mode);
  };

  const handleSurprise = () => {
    triggerHaptic();
    onSurprise();
  };

  const handleFix = () => {
    if (fixCount <= 0) {
      return;
    }
    triggerHaptic();
    onFix();
  };

  const handlePhotoClick = () => {
    triggerHaptic();
    onPhotoClick();
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleStart('sprint60')}
          className="neu-btn-primary neu-btn-float-only"
        >
          Start Sprint (60s)
        </button>
        <button
          type="button"
          onClick={() => handleStart('session120')}
          className="neu-btn-primary neu-btn-primary-muted neu-btn-float-only"
        >
          Start Session (120s)
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleFix}
          disabled={fixCount <= 0}
          className="neu-btn-secondary neu-btn-float-only disabled:opacity-50"
        >
          Fix My Misses{fixCount > 0 ? ` (${fixCount})` : ''}
        </button>
        <button
          type="button"
          onClick={handleSurprise}
          className="neu-btn-secondary neu-btn-float-only"
        >
          Surprise Me
        </button>
        <button
          type="button"
          onClick={handlePhotoClick}
          className="neu-btn-secondary neu-btn-float-only"
        >
          Photo Mode
        </button>
      </div>

      {isPhotoProcessing ? (
        <div className="space-y-2">
          <div className="h-1 w-full overflow-hidden rounded-pill bg-surface1">
            <div className="h-full w-1/3 animate-pulse rounded-pill bg-accent" />
          </div>
          <p className="neu-label">Scanning photo...</p>
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
