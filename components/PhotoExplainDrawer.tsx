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
    <section className="rounded-lg border border-consoleEdge bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">How we got this number</p>
      <div className="mt-3 flex flex-col gap-3 text-sm text-slate-300">
        <p>
          Status: <span className="font-medium text-slate-100">{status}</span>
        </p>
        {message ? <p>{message}</p> : null}

        {candidates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {candidates.map((candidate) => (
              <span
                key={candidate}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs geist-mono text-emerald-200"
              >
                {candidate}
              </span>
            ))}
          </div>
        ) : null}

        {swatches.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {swatches.map((swatch, index) => (
              <div key={`${swatch.hex}-${index}`} className="flex items-center gap-2 rounded-md border border-consoleEdge bg-black/30 px-2 py-1">
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
          <div key={`${block.title}-${index}`} className="rounded-md border border-consoleEdge bg-black/30 p-3">
            <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">{block.title}</h3>
            <div className="mt-2 flex flex-col gap-1 text-xs text-slate-300">
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
