export function PromptDisplay({ prompt }: { prompt: string }) {
  return (
    <div className="neu-inset px-6 py-8 text-center text-3xl font-semibold text-text sm:text-4xl geist-mono">
      {prompt}
    </div>
  );
}
