import type { Swatch } from '@/lib/photo/types';

type RawSwatch = {
  r: number;
  g: number;
  b: number;
  prominence: number;
};

const DEFAULT_SWATCH_COUNT = 6;
const DEFAULT_TIMEOUT_MS = 800;

export async function extractPalette(
  imageData: ImageData,
  swatchCount = DEFAULT_SWATCH_COUNT,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Swatch[]> {
  try {
    return await extractPaletteInWorker(imageData, swatchCount, timeoutMs);
  } catch {
    return extractPaletteOnMainThread(imageData, swatchCount);
  }
}

async function extractPaletteInWorker(
  imageData: ImageData,
  swatchCount: number,
  timeoutMs: number
): Promise<Swatch[]> {
  return new Promise<Swatch[]>((resolve, reject) => {
    let settled = false;

    const worker = new Worker(new URL('../../workers/palette.worker.ts', import.meta.url), {
      type: 'module'
    });

    const timeoutId = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      worker.terminate();
      reject(new Error('Palette worker timed out.'));
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<RawSwatch[]>) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      worker.terminate();
      resolve(event.data.map(toSwatch));
    };

    worker.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      worker.terminate();
      reject(new Error('Palette worker failed.'));
    };

    worker.postMessage({
      data: Array.from(imageData.data),
      swatchCount
    });
  });
}

function extractPaletteOnMainThread(imageData: ImageData, swatchCount: number): Swatch[] {
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
  let total = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i + 3];
    if (alpha < 32) {
      continue;
    }

    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
    total += 1;
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, swatchCount))
    .map((bucket) =>
      toSwatch({
        r: Math.round(bucket.r / bucket.count),
        g: Math.round(bucket.g / bucket.count),
        b: Math.round(bucket.b / bucket.count),
        prominence: total > 0 ? bucket.count / total : 0
      })
    );
}

function toSwatch(raw: RawSwatch): Swatch {
  const hex = `#${toHex(raw.r)}${toHex(raw.g)}${toHex(raw.b)}`;
  const { hue, lightness } = rgbToHsl(raw.r, raw.g, raw.b);
  return {
    ...raw,
    hex,
    hue,
    lightness
  };
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
}

function rgbToHsl(r: number, g: number, b: number): { hue: number; lightness: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let hue = 0;
  if (delta > 0) {
    if (max === rn) {
      hue = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      hue = (bn - rn) / delta + 2;
    } else {
      hue = (rn - gn) / delta + 4;
    }
    hue *= 60;
    if (hue < 0) {
      hue += 360;
    }
  }

  const lightness = ((max + min) / 2) * 100;
  return { hue, lightness };
}
