'use client';

import { useEffect, useMemo, useState } from 'react';
import { ConsoleCard } from '@/components/ConsoleCard';
import { ConsoleShell } from '@/components/ConsoleShell';
import { processPhotoForSeed } from '@/lib/photo/pipeline';
import { clampBrightnessTweak } from '@/lib/photo/brightness';

type TuneItem = {
  file: string;
  expected: string | null;
};

type ApiPayload = {
  ok: boolean;
  count: number;
  labelledCount: number;
  items: TuneItem[];
};

type RowResult = {
  file: string;
  expected: string | null;
  detected: string;
  exactMatch: boolean;
  seedSource: string;
  status: string;
  message: string;
  elapsedMs: number;
};

const DEFAULT_OCR_TIMEOUT = 6000;
const DEFAULT_PALETTE_TIMEOUT = 1200;

export default function TunePage() {
  const [items, setItems] = useState<TuneItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RowResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [brightnessTweak, setBrightnessTweak] = useState(0);
  const [ocrTimeoutMs, setOcrTimeoutMs] = useState(DEFAULT_OCR_TIMEOUT);
  const [paletteTimeoutMs, setPaletteTimeoutMs] = useState(DEFAULT_PALETTE_TIMEOUT);

  useEffect(() => {
    void loadManifest();
  }, []);

  const summary = useMemo(() => {
    const labelledResults = results.filter((row) => row.expected !== null);
    const exactMatches = labelledResults.filter((row) => row.exactMatch).length;
    const accuracy = labelledResults.length > 0 ? (exactMatches / labelledResults.length) * 100 : 0;
    return {
      total: items.length,
      labelled: items.filter((item) => item.expected !== null).length,
      ran: results.length,
      ranLabelled: labelledResults.length,
      exactMatches,
      accuracy
    };
  }, [items, results]);

  const mismatches = useMemo(
    () => results.filter((row) => row.expected !== null && !row.exactMatch),
    [results]
  );

  async function loadManifest() {
    setIsLoadingList(true);
    setError(null);
    try {
      const response = await fetch('/api/tune', { cache: 'no-store' });
      const payload = (await response.json()) as ApiPayload;
      if (!payload.ok) {
        setItems([]);
        setError('Could not load /public/tune. Add image files and refresh.');
        return;
      }
      setItems(payload.items);
    } catch (requestError) {
      setItems([]);
      setError(requestError instanceof Error ? requestError.message : 'Failed to load tune manifest.');
    } finally {
      setIsLoadingList(false);
    }
  }

  async function runBenchmark() {
    if (items.length === 0 || isRunning) {
      return;
    }

    setError(null);
    setResults([]);
    setProgress(0);
    setIsRunning(true);

    const nextResults: RowResult[] = [];

    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const startedAt = performance.now();
        try {
          const detected = await runSingle(item.file, {
            brightnessTweak,
            ocrTimeoutMs,
            paletteTimeoutMs
          });
          const elapsedMs = Math.round(performance.now() - startedAt);

          const row: RowResult = {
            file: item.file,
            expected: item.expected,
            detected: detected.seed,
            exactMatch: item.expected !== null ? detected.seed === item.expected : false,
            seedSource: detected.seedSource,
            status: detected.status,
            message: detected.message,
            elapsedMs
          };
          nextResults.push(row);
          setResults([...nextResults]);
          setProgress(index + 1);
        } catch (singleError) {
          const elapsedMs = Math.round(performance.now() - startedAt);
          const message =
            singleError instanceof Error ? singleError.message : 'Failed to process image.';
          nextResults.push({
            file: item.file,
            expected: item.expected,
            detected: '',
            exactMatch: false,
            seedSource: 'error',
            status: 'error',
            message,
            elapsedMs
          });
          setResults([...nextResults]);
          setProgress(index + 1);
        }
      }
    } finally {
      setIsRunning(false);
    }
  }

  function exportCsv() {
    if (results.length === 0) {
      return;
    }
    const lines = [
      ['file', 'expected', 'detected', 'exact_match', 'seed_source', 'status', 'elapsed_ms', 'message'].join(','),
      ...results.map((row) =>
        [
          escapeCsv(row.file),
          escapeCsv(row.expected ?? ''),
          escapeCsv(row.detected),
          row.exactMatch ? 'true' : 'false',
          escapeCsv(row.seedSource),
          escapeCsv(row.status),
          String(row.elapsedMs),
          escapeCsv(row.message)
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    anchor.href = url;
    anchor.download = `tune-results-${stamp}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ConsoleShell>
      <ConsoleCard>
        <div className="flex flex-col gap-3">
          <h1 className="text-lg font-semibold">Tune OCR</h1>
          <p className="text-sm text-slate-400">
            Expected value is parsed from the final hyphen in filename. Example:{' '}
            <span className="geist-mono">Capture-2026-02-11-221241-2025.png</span>
          </p>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {isLoadingList ? <p className="text-sm text-slate-400">Loading tune manifest...</p> : null}
        </div>
      </ConsoleCard>

      <ConsoleCard>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            Brightness
            <input
              type="number"
              value={brightnessTweak}
              min={-40}
              max={40}
              onChange={(event) => setBrightnessTweak(clampBrightnessTweak(Number(event.target.value)))}
              className="rounded-md border border-consoleEdge bg-black/30 px-2 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            OCR timeout ms
            <input
              type="number"
              value={ocrTimeoutMs}
              min={1000}
              step={100}
              onChange={(event) => setOcrTimeoutMs(Math.max(1000, Math.round(Number(event.target.value))))}
              className="rounded-md border border-consoleEdge bg-black/30 px-2 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            Palette timeout ms
            <input
              type="number"
              value={paletteTimeoutMs}
              min={300}
              step={100}
              onChange={(event) => setPaletteTimeoutMs(Math.max(300, Math.round(Number(event.target.value))))}
              className="rounded-md border border-consoleEdge bg-black/30 px-2 py-2 text-sm text-slate-100"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runBenchmark}
            disabled={isRunning || items.length === 0}
            className="h-10 rounded-lg border border-accent bg-emerald-500/20 px-4 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? 'Running...' : 'Run Benchmark'}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={results.length === 0}
            className="h-10 rounded-lg border border-consoleEdge bg-black/40 px-4 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => void loadManifest()}
            className="h-10 rounded-lg border border-consoleEdge bg-black/40 px-4 text-sm text-slate-200"
          >
            Refresh Files
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Progress: {progress}/{items.length}
        </p>
      </ConsoleCard>

      <ConsoleCard>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <p>Total files: {summary.total}</p>
          <p>Labelled files: {summary.labelled}</p>
          <p>Ran files: {summary.ran}</p>
          <p>Exact matches: {summary.exactMatches}</p>
          <p>Labelled run count: {summary.ranLabelled}</p>
          <p>Exact accuracy: {summary.accuracy.toFixed(1)}%</p>
        </div>
      </ConsoleCard>

      <ConsoleCard>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">Mismatches ({mismatches.length})</h2>
          {mismatches.length === 0 ? (
            <p className="text-sm text-slate-400">No mismatches found in this run.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-2 py-2">File</th>
                    <th className="px-2 py-2">Expected</th>
                    <th className="px-2 py-2">Detected</th>
                    <th className="px-2 py-2">Source</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">ms</th>
                  </tr>
                </thead>
                <tbody>
                  {mismatches.map((row) => (
                    <tr key={row.file} className="border-t border-consoleEdge">
                      <td className="px-2 py-2 geist-mono text-xs">{row.file}</td>
                      <td className="px-2 py-2 geist-mono">{row.expected}</td>
                      <td className="px-2 py-2 geist-mono">{row.detected || '-'}</td>
                      <td className="px-2 py-2">{row.seedSource}</td>
                      <td className="px-2 py-2">{row.status}</td>
                      <td className="px-2 py-2 geist-mono">{row.elapsedMs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ConsoleCard>
    </ConsoleShell>
  );
}

async function runSingle(
  fileName: string,
  options: { brightnessTweak: number; ocrTimeoutMs: number; paletteTimeoutMs: number }
) {
  const response = await fetch(`/tune/${encodeURIComponent(fileName)}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${fileName}`);
  }
  const blob = await response.blob();
  const file = new File([blob], fileName, { type: blob.type || 'image/png' });
  return processPhotoForSeed(file, options);
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
