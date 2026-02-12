import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '@/lib/state/store';
import { getDefaultSettings } from '@/lib/state/defaults';
import type { Attempt } from '@/lib/types';

function buildWrongAttempt(id: string): Attempt {
  return {
    id,
    ts: Date.now(),
    seed: '999999',
    seedSource: 'typed',
    mode: 'sprint60',
    tempo: 'flow',
    flash: false,
    moveId: 'add',
    templateId: 'add',
    prompt: '1234 + 4321',
    answer: 5555,
    userAnswer: '0',
    isCorrect: false,
    isAssisted: false,
    hintUsed: false,
    timeMs: 800
  };
}

describe('store session startup', () => {
  beforeEach(() => {
    useAppStore.setState({
      settings: getDefaultSettings(),
      attempts: [],
      session: undefined,
      sessionMeta: undefined,
      hydrated: true
    });
  });

  it('does not inject fix queue into sprint/session starts', () => {
    useAppStore.setState({
      attempts: [buildWrongAttempt('a1')]
    });

    useAppStore.getState().startSession('sprint60', '601208', 'photo-ocr');
    const sprintSession = useAppStore.getState().session;
    expect(sprintSession?.seed).toBe('601208');
    expect(sprintSession?.seedSource).toBe('photo-ocr');
    expect(sprintSession?.currentQuestion?.id.startsWith('fix-')).toBe(false);
    expect(sprintSession?.fixTotal).toBe(0);

    useAppStore.getState().startSession('session120', '776655', 'typed');
    const session120 = useAppStore.getState().session;
    expect(session120?.currentQuestion?.id.startsWith('fix-')).toBe(false);
    expect(session120?.fixTotal).toBe(0);
  });

  it('still uses fix queue when mode is fix', () => {
    const attempt = buildWrongAttempt('a2');
    useAppStore.setState({
      attempts: [attempt]
    });

    useAppStore.getState().startSession('fix', '445566', 'typed');
    const fixSession = useAppStore.getState().session;
    expect(fixSession?.currentQuestion?.id).toBe(`fix-${attempt.id}`);
    expect(fixSession?.fixTotal).toBe(1);
  });
});
