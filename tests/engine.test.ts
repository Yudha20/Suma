import { describe, expect, it } from 'vitest';
import { buildFixQueue, generateWeightedSeed, getSessionDurationMs, sanitizeSeed } from '@/lib/session/engine';
import type { Attempt } from '@/lib/types';


describe('engine helpers', () => {
  it('sanitizes seed to digits only', () => {
    expect(sanitizeSeed('a12b3')).toBe('123');
  });

  it('returns empty string for too-short seed', () => {
    expect(sanitizeSeed('9')).toBe('');
  });

  it('generates weighted seed length between 2 and 8', () => {
    const seed = generateWeightedSeed();
    expect(seed.length).toBeGreaterThanOrEqual(2);
    expect(seed.length).toBeLessThanOrEqual(8);
  });

  it('uses correct session durations', () => {
    expect(getSessionDurationMs('sprint60')).toBe(60000);
    expect(getSessionDurationMs('session120')).toBe(120000);
  });

  it('builds fix queue from wrong, assisted, or slow attempts', () => {
    const now = Date.now();
    const attempts: Attempt[] = [
      {
        id: 'a1',
        ts: now,
        seed: '1111',
        seedSource: 'auto',
        mode: 'sprint60',
        tempo: 'flow',
        flash: false,
        moveId: 'add',
        templateId: 'add',
        prompt: '2 + 2',
        answer: 4,
        userAnswer: '5',
        isCorrect: false,
        isAssisted: false,
        hintUsed: false,
        timeMs: 1000
      },
      {
        id: 'a2',
        ts: now - 1,
        seed: '1111',
        seedSource: 'auto',
        mode: 'sprint60',
        tempo: 'flow',
        flash: false,
        moveId: 'sub',
        templateId: 'sub',
        prompt: '8 - 3',
        answer: 5,
        userAnswer: '5',
        isCorrect: true,
        isAssisted: true,
        hintUsed: false,
        timeMs: 1200
      },
      {
        id: 'a3',
        ts: now - 2,
        seed: '1111',
        seedSource: 'auto',
        mode: 'sprint60',
        tempo: 'fast',
        flash: false,
        moveId: 'mul',
        templateId: 'mul',
        prompt: '7 x 7',
        answer: 49,
        userAnswer: '49',
        isCorrect: true,
        isAssisted: false,
        hintUsed: false,
        timeMs: 4001
      }
    ];

    const queue = buildFixQueue(attempts, 'sprint60');
    expect(queue).toHaveLength(3);
    expect(queue[0].id).toBe('fix-a1');
    expect(queue[1].id).toBe('fix-a2');
    expect(queue[2].id).toBe('fix-a3');
  });

  it('caps sprint fix queue to 3 items', () => {
    const now = Date.now();
    const attempts: Attempt[] = Array.from({ length: 6 }).map((_, index) => ({
      id: `x${index}`,
      ts: now - index,
      seed: '1234',
      seedSource: 'auto',
      mode: 'sprint60',
      tempo: 'flow',
      flash: false,
      moveId: 'add',
      templateId: 'add',
      prompt: `${index} + 1`,
      answer: index + 1,
      userAnswer: '0',
      isCorrect: false,
      isAssisted: false,
      hintUsed: false,
      timeMs: 500
    }));

    expect(buildFixQueue(attempts, 'sprint60')).toHaveLength(3);
    expect(buildFixQueue(attempts, 'session120')).toHaveLength(5);
  });
});
