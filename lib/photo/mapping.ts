import { clampBrightnessTweak } from '@/lib/photo/brightness';
import type { Swatch } from '@/lib/photo/types';

const HUE_BUCKET_COUNT = 6;

export type PaletteSeedResult = {
  seed: string;
  legend: string[];
};

export function deriveSeedFromPalette(
  swatches: Swatch[],
  brightnessTweak: number,
  maxDigits = 8
): PaletteSeedResult {
  const tweak = clampBrightnessTweak(brightnessTweak);
  const threshold = 50 + tweak;

  const sorted = [...swatches]
    .sort((a, b) => b.prominence - a.prominence)
    .slice(0, maxDigits);

  const digits: string[] = [];
  const legend: string[] = [];

  for (const swatch of sorted) {
    const hueBucket = Math.min(HUE_BUCKET_COUNT - 1, Math.floor(swatch.hue / (360 / HUE_BUCKET_COUNT)));
    const brightnessIndex = swatch.lightness >= threshold ? 1 : 0;
    const digit = (hueBucket * 2 + brightnessIndex) % 10;
    digits.push(String(digit));
    legend.push(
      `${swatch.hex}: hue bucket ${hueBucket}, brightness ${brightnessIndex === 1 ? 'high' : 'low'} -> ${digit}`
    );
  }

  const seed = digits.join('').slice(0, maxDigits);
  return { seed, legend };
}
