import type { Settings } from '@/lib/types';
import { getDefaultMoves } from '@/lib/questions/templates';

export function getDefaultSettings(): Settings {
  return {
    digitsMax: 4,
    tempo: 'flow',
    flashEnabled: false,
    flashMs: 1200,
    movesEnabled: getDefaultMoves(),
    sttEnabled: false,
    brightnessTweak: 0
  };
}
