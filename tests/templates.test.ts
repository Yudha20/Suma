import { describe, expect, it } from 'vitest';
import { buildQuestion, getDefaultMoves } from '@/lib/questions/templates';
import { getDefaultSettings } from '@/lib/state/defaults';


describe('question templates', () => {
  it('divide template yields integer answer', () => {
    const settings = getDefaultSettings();
    const question = buildQuestion('div', 'seed', 0, settings);
    expect(Number.isInteger(question.answer)).toBe(true);
  });

  it('builds questions for all default moves', () => {
    const settings = getDefaultSettings();
    const questions = getDefaultMoves().map((move, index) => buildQuestion(move, 'seed', index, settings));
    expect(questions.length).toBe(getDefaultMoves().length);
  });
});
