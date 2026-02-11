import Link from 'next/link';

export function HomeHeader() {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-3xl font-semibold text-slate-100">Suma</h1>
      <p className="text-sm text-slate-400">
        A 60-120s mental workout powered by the numbers around you.
      </p>
      <Link href="/tune" className="w-fit text-xs uppercase tracking-[0.2em] text-emerald-300 hover:text-emerald-200">
        Open OCR Tune
      </Link>
    </header>
  );
}
