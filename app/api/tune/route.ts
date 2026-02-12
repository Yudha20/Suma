import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

type TuneItem = {
  file: string;
  expected: string | null;
};

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export async function GET() {
  const tuneDir = path.join(process.cwd(), 'public', 'tune');

  try {
    const entries = await readdir(tuneDir, { withFileTypes: true });
    const items: TuneItem[] = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => ({
        file,
        expected: parseExpectedFromFilename(file)
      }));

    return NextResponse.json({
      ok: true,
      count: items.length,
      labelledCount: items.filter((item) => item.expected !== null).length,
      items
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        count: 0,
        labelledCount: 0,
        items: []
      },
      { status: 200 }
    );
  }
}

function parseExpectedFromFilename(file: string): string | null {
  // Strip the file extension, then grab everything after the last hyphen.
  const stem = file.replace(/\.[^.]+$/, '');
  const lastHyphen = stem.lastIndexOf('-');
  if (lastHyphen === -1) {
    return null;
  }
  const tail = stem.slice(lastHyphen + 1).trim();
  // Accept pure digit strings of any length (1+).
  return /^\d+$/.test(tail) ? tail : null;
}
