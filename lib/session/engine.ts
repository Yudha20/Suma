import type { Attempt, MoveId, Question, SeedSource, SessionMode, Settings, Tempo } from '@/lib/types';
import { buildQuestion } from '@/lib/questions/templates';
import { createSeededRng, pickWeighted, randInt } from '@/lib/session/rng';

export type SessionConfig = {
  mode: SessionMode;
  seed: string;
  seedSource: SeedSource;
  startTs: number;
  settings: Settings;
};

export const moveDefaults: MoveId[] = ['add', 'sub', 'mul', 'div', 'split', 'gst18', 'round', 'next1000'];
const RECENT_FIX_WINDOW = 50;

export function getSessionDurationMs(mode: SessionMode): number {
  switch (mode) {
    case 'sprint60':
      return 60_000;
    case 'session120':
      return 120_000;
    case 'fix':
      return 60_000;
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

export function getSlowThresholdMs(tempo: Tempo): number {
  switch (tempo) {
    case 'calm':
      return 6000;
    case 'flow':
      return 4000;
    case 'fast':
      return 3000;
    default: {
      const exhaustive: never = tempo;
      return exhaustive;
    }
  }
}

export function sanitizeSeed(input: string): string {
  const digitsOnly = input.replace(/\D/g, '').slice(0, 8);
  if (digitsOnly.length < 2) {
    return '';
  }
  return digitsOnly;
}

export function generateWeightedSeed(): string {
  const rng = createSeededRng(`${Date.now()}-${Math.random()}`);
  const digits = pickWeighted(rng, [
    { value: 2, weight: 3 },
    { value: 3, weight: 5 },
    { value: 4, weight: 7 },
    { value: 6, weight: 3 },
    { value: 8, weight: 1 }
  ]);
  let seed = '';
  for (let i = 0; i < digits; i += 1) {
    seed += randInt(rng, 0, 9).toString();
  }
  if (seed[0] === '0') {
    seed = '1' + seed.slice(1);
  }
  return seed;
}

export function generateQuestionAtIndex(
  config: SessionConfig,
  index: number,
  lastMoves: MoveId[]
): Question {
  const { seed, startTs, settings } = config;
  const rng = createSeededRng(`${seed}:${startTs}:${index}`);
  const moves = settings.movesEnabled.length > 0 ? settings.movesEnabled : moveDefaults;
  let moveId = moves[randInt(rng, 0, moves.length - 1)];

  if (lastMoves.length >= 2 && lastMoves[lastMoves.length - 1] === lastMoves[lastMoves.length - 2]) {
    const alternatives = moves.filter((move) => move !== lastMoves[lastMoves.length - 1]);
    if (alternatives.length > 0) {
      moveId = alternatives[randInt(rng, 0, alternatives.length - 1)];
    }
  }

  return buildQuestion(moveId, `${seed}:${startTs}`, index, settings);
}

export function createSessionConfig(
  mode: SessionMode,
  seed: string,
  seedSource: SeedSource,
  settings: Settings,
  startTs?: number
): SessionConfig {
  return {
    mode,
    seed,
    seedSource,
    startTs: startTs ?? Date.now(),
    settings
  };
}

function getFixCountByMode(mode: SessionMode): number {
  switch (mode) {
    case 'sprint60':
      return 3;
    case 'session120':
      return 5;
    case 'fix':
      return 8;
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

function toFixQuestion(attempt: Attempt): Question {
  return {
    id: `fix-${attempt.id}`,
    moveId: attempt.moveId,
    templateId: attempt.templateId,
    prompt: attempt.prompt,
    answer: attempt.answer
  };
}

function isEligibleForFix(attempt: Attempt): boolean {
  if (!attempt.isCorrect || attempt.isAssisted) {
    return true;
  }
  return attempt.timeMs > getSlowThresholdMs(attempt.tempo);
}

export function isFixQuestion(question: Question): boolean {
  return question.id.startsWith('fix-');
}

export function buildFixQueue(attempts: Attempt[], mode: SessionMode): Question[] {
  const maxFixCount = getFixCountByMode(mode);
  const seen = new Set<string>();
  const queue: Question[] = [];

  for (const attempt of attempts.slice(0, RECENT_FIX_WINDOW)) {
    if (!isEligibleForFix(attempt)) {
      continue;
    }

    const dedupeKey = `${attempt.templateId}:${attempt.prompt}:${attempt.answer}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    queue.push(toFixQuestion(attempt));

    if (queue.length >= maxFixCount) {
      break;
    }
  }

  return queue;
}
