import { describe, expect, it } from 'vitest';
import { deriveSeedFromPalette } from '@/lib/photo/mapping';
import type { Swatch } from '@/lib/photo/types';

const swatches: Swatch[] = [
  { r: 220, g: 30, b: 50, hex: '#dc1e32', prominence: 0.5, hue: 355, lightness: 49 },
  { r: 40, g: 120, b: 220, hex: '#2878dc', prominence: 0.3, hue: 213, lightness: 51 },
  { r: 40, g: 190, b: 70, hex: '#28be46', prominence: 0.2, hue: 132, lightness: 45 }
];

describe('deriveSeedFromPalette', () => {
  it('derives deterministic digits from swatches', () => {
    const result = deriveSeedFromPalette(swatches, 0, 8);
    expect(result.seed).toBe('074');
    expect(result.legend.length).toBe(3);
  });

  it('shifts brightness threshold with tweak', () => {
    const resultLow = deriveSeedFromPalette(swatches, -20, 8);
    const resultHigh = deriveSeedFromPalette(swatches, 20, 8);
    expect(resultLow.seed).not.toBe(resultHigh.seed);
  });
});
