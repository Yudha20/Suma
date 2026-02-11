export function PromptDisplay({ prompt }: { prompt: string }) {
  return (
    <div className="rounded-lg border border-consoleEdge bg-black/50 px-6 py-8 text-center text-3xl font-semibold text-slate-100 sm:text-4xl geist-mono">
      {prompt}
    </div>
  );
}
