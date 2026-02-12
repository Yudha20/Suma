import Link from 'next/link';

export function HomeHeader() {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-[40px] leading-[48px] font-semibold tracking-tight text-text">Suma</h1>
      <p className="text-sm leading-5 text-text-muted">
        A 60-120s mental workout powered by the numbers around you.
      </p>
      <Link
        href="/tune"
        className="neu-btn-secondary mt-1 w-fit"
      >
        Open OCR Tune
      </Link>
    </header>
  );
}
