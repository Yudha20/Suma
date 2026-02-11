import { describe, expect, it } from 'vitest';
import { createSeededRng } from '@/lib/session/rng';

describe('createSeededRng', () => {
  it('is deterministic for the same seed', () => {
    const rngA = createSeededRng('seed-1');
    const rngB = createSeededRng('seed-1');
    const valuesA = [rngA(), rngA(), rngA()];
    const valuesB = [rngB(), rngB(), rngB()];
    expect(valuesA).toEqual(valuesB);
  });
});
