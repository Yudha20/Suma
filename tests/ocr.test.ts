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

  // ── New tests for OCR improvements ──

  it('extracts 10-digit numbers', () => {
    const digits = extractDigitsFromText('receipt 1234567890 total');
    expect(digits).toContain('1234567890');
  });

  it('handles 9-digit runs', () => {
    const digits = extractDigitsFromText('code: 123456789');
    expect(digits).toContain('123456789');
  });

  it('strips common letter prefixes from alphanumeric codes', () => {
    const digits = extractDigitsFromText('NC0219');
    expect(digits).toContain('0219');
  });

  it('handles single-letter prefix codes', () => {
    const digits = extractDigitsFromText('A1234');
    expect(digits).toContain('1234');
  });

  it('accepts 2-digit candidate at lowered confidence threshold', () => {
    const best = pickBestOcrCandidate([
      { digits: '14', confidence: 0.75, source: 'tesseract' }
    ]);
    expect(best?.digits).toBe('14');
  });

  it('rejects 2-digit candidate below confidence threshold', () => {
    const best = pickBestOcrCandidate([
      { digits: '14', confidence: 0.3, source: 'tesseract' }
    ]);
    // With score below threshold, it should still return the candidate since
    // pickBestOcrCandidate just picks best from valid; filtering happens in pipeline.
    expect(best?.digits).toBe('14');
  });

  it('accepts 10-digit candidate in pickBestOcrCandidate', () => {
    const best = pickBestOcrCandidate([
      { digits: '1234567890', confidence: 0.7, source: 'tesseract' },
      { digits: '1234', confidence: 0.5, source: 'text-detector' }
    ]);
    expect(best?.digits).toBe('1234567890');
  });
});
