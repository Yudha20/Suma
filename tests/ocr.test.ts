import { describe, expect, it } from 'vitest';
import { extractDigitsFromText, pickBestOcrCandidate } from '@/lib/photo/ocr';

describe('pickBestOcrCandidate', () => {
  it('picks the longest then highest-confidence candidate', () => {
    const best = pickBestOcrCandidate([
      { digits: '1234', confidence: 0.5 },
      { digits: '987654', confidence: 0.5 },
      { digits: '111111', confidence: 0.7 }
    ]);

    expect(best?.digits).toBe('111111');
  });

  it('returns null when no valid candidate exists', () => {
    const best = pickBestOcrCandidate([{ digits: '1', confidence: 0.9 }]);
    expect(best).toBeNull();
  });

  it('extracts normalized digit groups from noisy text', () => {
    const digits = extractDigitsFromText('Total: 12 34, token 56-78 and 9012');
    expect(digits).toContain('1234');
    expect(digits).toContain('5678');
    expect(digits).toContain('9012');
  });

  it('merges spaced single digits from OCR output', () => {
    const digits = extractDigitsFromText('5 0 0 0 7 2');
    expect(digits).toContain('500072');
  });

  it('normalizes common handwritten lookalikes when token has digits', () => {
    const digits = extractDigitsFromText('receipt id: S0B2');
    expect(digits).toContain('5082');
  });

  it('does not treat alphabetic words as number runs', () => {
    const digits = extractDigitsFromText('Store name: BOSS');
    expect(digits).not.toContain('8055');
  });

  it('does not merge across words', () => {
    const digits = extractDigitsFromText('North 1, 2 West 3, 4');
    expect(digits).not.toContain('1234');
  });

  it('does not create 8-digit slices from long numeric ids', () => {
    const digits = extractDigitsFromText('Asset id: 2618033377');
    expect(digits).not.toContain('26180333');
    expect(digits).not.toContain('18033377');
  });

  it('does not merge digit groups across long separators', () => {
    const digits = extractDigitsFromText('12 ..... 34');
    expect(digits).not.toContain('1234');
  });

  it('prefers realistic seed length over shorter higher-confidence candidate', () => {
    const best = pickBestOcrCandidate([
      { digits: '12', confidence: 0.99, source: 'text-detector' },
      { digits: '500072', confidence: 0.42, source: 'tesseract' }
    ]);

    expect(best?.digits).toBe('500072');
  });
});
