import type { MoveId, Question, Settings } from '@/lib/types';
import { createSeededRng, randInt } from '@/lib/session/rng';

export type QuestionBuilder = (rngSeed: string, index: number, settings: Settings) => Question;

const moveList: MoveId[] = ['add', 'sub', 'mul', 'div', 'split', 'gst18', 'round', 'next1000'];

export function getDefaultMoves(): MoveId[] {
  return [...moveList];
}

function digitsRange(digits: Settings['digitsMax']): { min: number; max: number } {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return { min, max };
}

function buildAdd(rngSeed: string, index: number, settings: Settings): Question {
  const rng = makeRng(rngSeed, index, 'add');
  const { min, max } = digitsRange(settings.digitsMax);
  const a = randInt(rng, min, max);
  const b = randInt(rng, min, max);
  return {
    id: questionId('add', index),
    moveId: 'add',
    templateId: 'add',
    prompt: `${a} + ${b}`,
    answer: a + b
  };
}

function buildSub(rngSeed: string, index: number, settings: Settings): Question {
  const rng = makeRng(rngSeed, index, 'sub');
  const { min, max } = digitsRange(settings.digitsMax);
  const a = randInt(rng, min, max);
  const b = randInt(rng, min, max);
  const [hi, lo] = a >= b ? [a, b] : [b, a];
  return {
    id: questionId('sub', index),
    moveId: 'sub',
    templateId: 'sub',
    prompt: `${hi} − ${lo}`,
    answer: hi - lo
  };
}

function buildMul(rngSeed: string, index: number): Question {
  const rng = makeRng(rngSeed, index, 'mul');
  const a = randInt(rng, 2, 20);
  const b = randInt(rng, 1, 12);
  return {
    id: questionId('mul', index),
    moveId: 'mul',
    templateId: 'mul',
    prompt: `${a} × ${b}`,
    answer: a * b
  };
}

function buildDiv(rngSeed: string, index: number): Question {
  const rng = makeRng(rngSeed, index, 'div');
  const b = randInt(rng, 2, 12);
  const k = randInt(rng, 2, 20);
  const a = b * k;
  return {
    id: questionId('div', index),
    moveId: 'div',
    templateId: 'div',
    prompt: `${a} ÷ ${b}`,
    answer: k
  };
}

function buildSplit(rngSeed: string, index: number, settings: Settings): Question {
  const rng = makeRng(rngSeed, index, 'split');
  const { min, max } = digitsRange(settings.digitsMax);
  const total = randInt(rng, min, max);
  const n = [2, 3, 4, 5, 6, 8, 10][randInt(rng, 0, 6)];
  const adjusted = total - (total % n);
  return {
    id: questionId('split', index),
    moveId: 'split',
    templateId: 'split',
    prompt: `Split ${adjusted} among ${n} people`,
    answer: adjusted / n
  };
}

function buildGst(rngSeed: string, index: number, settings: Settings): Question {
  const rng = makeRng(rngSeed, index, 'gst18');
  const { min, max } = digitsRange(settings.digitsMax);
  const base = randInt(rng, min, max);
  const answer = Math.round(base * 1.18);
  return {
    id: questionId('gst18', index),
    moveId: 'gst18',
    templateId: 'gst18',
    prompt: `Add 18% GST to ${base} and round`,
    answer
  };
}

function buildRound(rngSeed: string, index: number, settings: Settings): Question {
  const rng = makeRng(rngSeed, index, 'round');
  const { min, max } = digitsRange(settings.digitsMax);
  const value = randInt(rng, min, max);
  const factors = [10, 100, 1000];
  const factor = factors[randInt(rng, 0, factors.length - 1)];
  const answer = Math.round(value / factor) * factor;
  return {
    id: questionId('round', index),
    moveId: 'round',
    templateId: 'round',
    prompt: `Round ${value} to nearest ${factor}`,
    answer
  };
}

function buildNext1000(rngSeed: string, index: number, settings: Settings): Question {
  const rng = makeRng(rngSeed, index, 'next1000');
  const { min, max } = digitsRange(settings.digitsMax);
  const value = randInt(rng, min, max);
  const next = Math.ceil(value / 1000) * 1000;
  const answer = next - value;
  return {
    id: questionId('next1000', index),
    moveId: 'next1000',
    templateId: 'next1000',
    prompt: `How much more to reach the next 1000 from ${value}?`,
    answer
  };
}

function makeRng(seed: string, index: number, moveId: string) {
  return createSeededRng(`${seed}:${index}:${moveId}`);
}

function questionId(moveId: string, index: number): string {
  return `${moveId}-${index}`;
}

export function buildQuestion(
  moveId: MoveId,
  rngSeed: string,
  index: number,
  settings: Settings
): Question {
  switch (moveId) {
    case 'add':
      return buildAdd(rngSeed, index, settings);
    case 'sub':
      return buildSub(rngSeed, index, settings);
    case 'mul':
      return buildMul(rngSeed, index);
    case 'div':
      return buildDiv(rngSeed, index);
    case 'split':
      return buildSplit(rngSeed, index, settings);
    case 'gst18':
      return buildGst(rngSeed, index, settings);
    case 'round':
      return buildRound(rngSeed, index, settings);
    case 'next1000':
      return buildNext1000(rngSeed, index, settings);
    default: {
      const exhaustive: never = moveId;
      throw new Error(`Unknown moveId: ${exhaustive}`);
    }
  }
}
