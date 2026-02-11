import type { Attempt, Settings } from '@/lib/types';
import { getDefaultSettings } from '@/lib/state/defaults';

function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const settings = value as Settings;
  return (
    (settings.digitsMax === 2 || settings.digitsMax === 3 || settings.digitsMax === 4 || settings.digitsMax === 6 || settings.digitsMax === 8) &&
    (settings.tempo === 'calm' || settings.tempo === 'fast' || settings.tempo === 'flow') &&
    typeof settings.flashEnabled === 'boolean' &&
    typeof settings.flashMs === 'number' &&
    Array.isArray(settings.movesEnabled) &&
    typeof settings.sttEnabled === 'boolean' &&
    typeof settings.brightnessTweak === 'number'
  );
}

export function migrateSettings(input: unknown): Settings {
  if (isSettings(input)) {
    return input;
  }
  return getDefaultSettings();
}

function isAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const attempt = value as Attempt;
  return (
    typeof attempt.id === 'string' &&
    typeof attempt.ts === 'number' &&
    typeof attempt.seed === 'string' &&
    typeof attempt.seedSource === 'string' &&
    typeof attempt.mode === 'string' &&
    typeof attempt.tempo === 'string' &&
    typeof attempt.flash === 'boolean' &&
    typeof attempt.moveId === 'string' &&
    typeof attempt.templateId === 'string' &&
    typeof attempt.prompt === 'string' &&
    typeof attempt.answer === 'number' &&
    typeof attempt.userAnswer === 'string' &&
    typeof attempt.isCorrect === 'boolean' &&
    typeof attempt.isAssisted === 'boolean' &&
    typeof attempt.hintUsed === 'boolean' &&
    typeof attempt.timeMs === 'number'
  );
}

export function migrateAttempts(input: unknown): Attempt[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter(isAttempt);
}
