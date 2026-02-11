import { describe, expect, it } from 'vitest';
import { scoreAttempt } from '@/lib/session/scoring';


describe('scoreAttempt', () => {
  it('marks correct answer properly', () => {
    const attempt = scoreAttempt({
      question: {
        id: 'add-0',
        moveId: 'add',
        templateId: 'add',
        prompt: '2 + 2',
        answer: 4
      },
      userAnswer: '4',
      timeMs: 1200,
      seed: '1234',
      seedSource: 'auto',
      mode: 'sprint60',
      tempo: 'flow',
      flash: false,
      hintUsed: false,
      isAssisted: false
    });
    expect(attempt.isCorrect).toBe(true);
  });
});
