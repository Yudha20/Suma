import type { ExplainBlock, PhotoStatus, Swatch } from '@/lib/photo/types';

export function PhotoExplainDrawer({
  status,
  message,
  candidates,
  explainability,
  swatches
}: {
  status: PhotoStatus;
  message: string | null;
  candidates: string[];
  explainability: ExplainBlock[];
  swatches: Swatch[];
}) {
  return (
    <section className="neu-capsule p-6">
      <p className="neu-label">How we got this number</p>
      <div className="mt-3 flex flex-col gap-3 text-sm text-text-muted">
        <p>
          Status: <span className="font-medium text-text">{status}</span>
        </p>
        {message ? <p>{message}</p> : null}

        {candidates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {candidates.map((candidate) => (
              <span
                key={candidate}
                className="rounded-field border border-accent/35 bg-accent/10 px-2 py-1 text-xs geist-mono text-green-300"
              >
                {candidate}
              </span>
            ))}
          </div>
        ) : null}

        {swatches.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {swatches.map((swatch, index) => (
              <div
                key={`${swatch.hex}-${index}`}
                className="neu-inset flex items-center gap-2 px-2 py-1"
              >
                <span
                  className="inline-block h-4 w-4 rounded-sm border border-black/40"
                  style={{ backgroundColor: swatch.hex }}
                  aria-hidden="true"
                />
                <span className="text-xs">{swatch.hex}</span>
              </div>
            ))}
          </div>
        ) : null}

        {explainability.map((block, index) => (
          <div
            key={`${block.title}-${index}`}
            className="neu-inset p-3"
          >
            <h3 className="neu-label">{block.title}</h3>
            <div className="mt-2 flex flex-col gap-1 text-xs text-text-muted">
              {block.lines.map((line, lineIndex) => (
                <p key={`${block.title}-${lineIndex}`}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
