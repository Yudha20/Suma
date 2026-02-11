import type { Attempt, Question, SessionMode, SeedSource, Tempo } from '@/lib/types';

export type ScoreInput = {
  question: Question;
  userAnswer: string;
  timeMs: number;
  seed: string;
  seedSource: SeedSource;
  mode: SessionMode;
  tempo: Tempo;
  flash: boolean;
  hintUsed: boolean;
  isAssisted: boolean;
};

export function scoreAttempt(input: ScoreInput): Attempt {
  const parsed = Number(input.userAnswer.trim());
  const isValid = Number.isFinite(parsed);
  const isCorrect = isValid && parsed === input.question.answer;

  return {
    id: `${input.question.id}-${Date.now()}`,
    ts: Date.now(),
    seed: input.seed,
    seedSource: input.seedSource,
    mode: input.mode,
    tempo: input.tempo,
    flash: input.flash,
    moveId: input.question.moveId,
    templateId: input.question.templateId,
    prompt: input.question.prompt,
    answer: input.question.answer,
    userAnswer: input.userAnswer,
    isCorrect,
    isAssisted: input.isAssisted,
    hintUsed: input.hintUsed,
    timeMs: input.timeMs
  };
}

export function getSummary(attempts: Attempt[]): { total: number; correct: number; accuracy: number; avgTimeMs: number } {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.isCorrect).length;
  const accuracy = total === 0 ? 0 : correct / total;
  const avgTimeMs = total === 0 ? 0 : Math.round(attempts.reduce((sum, a) => sum + a.timeMs, 0) / total);
  return { total, correct, accuracy, avgTimeMs };
}
