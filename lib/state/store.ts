'use client';

import { create } from 'zustand';
import type { Attempt, MoveId, Question, SeedSource, SessionMode, SessionState, Settings } from '@/lib/types';
import {
  buildFixQueue,
  createSessionConfig,
  generateQuestionAtIndex,
  getSessionDurationMs,
  isFixQuestion
} from '@/lib/session/engine';
import { scoreAttempt } from '@/lib/session/scoring';
import { loadAttempts, loadSettings, saveAttempts, saveSettings } from '@/lib/storage/local';
import { getDefaultSettings } from '@/lib/state/defaults';

const MAX_ATTEMPTS = 200;

type SessionMeta = {
  generatedIndex: number;
  lastMoves: MoveId[];
  questionStartTs: number;
};

type StoreState = {
  settings: Settings;
  session?: SessionState;
  sessionMeta?: SessionMeta;
  attempts: Attempt[];
  hydrated: boolean;
  hydrate: () => void;
  setSettings: (partial: Partial<Settings>) => void;
  startSession: (mode: SessionMode, seed: string, seedSource: SeedSource) => void;
  endSession: () => void;
  answerCurrent: (userAnswer: string, hintUsed: boolean, isAssisted: boolean) => Attempt | null;
  setCurrentQuestion: (question: Question) => void;
  updateTimeLeft: (timeLeftMs: number) => void;
};

export const useAppStore = create<StoreState>((set, get) => ({
  settings: getDefaultSettings(),
  attempts: [],
  hydrated: false,
  hydrate: () => {
    const settings = loadSettings();
    const attempts = loadAttempts();
    set({ settings, attempts, hydrated: true });
  },
  setSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    saveSettings(next);
  },
  startSession: (mode, seed, seedSource) => {
    const settings = get().settings;
    const config = createSessionConfig(mode, seed, seedSource, settings);
    const fixQueue = mode === 'fix' ? buildFixQueue(get().attempts, mode) : [];
    const question = fixQueue[0] ?? generateQuestionAtIndex(config, 0, []);
    const queue = fixQueue.length > 0 ? fixQueue.slice(1) : [];
    const session: SessionState = {
      mode,
      seed,
      seedSource,
      startTs: config.startTs,
      timeLeftMs: getSessionDurationMs(mode),
      currentQuestion: question,
      queue,
      fixTotal: fixQueue.length,
      fixAnswered: 0,
      results: []
    };
    set({
      session,
      sessionMeta: {
        generatedIndex: fixQueue.length > 0 ? 0 : 1,
        lastMoves: [question.moveId],
        questionStartTs: performance.now()
      }
    });
  },
  endSession: () => {
    set({ session: undefined, sessionMeta: undefined });
  },
  answerCurrent: (userAnswer, hintUsed, isAssisted) => {
    const { session, sessionMeta } = get();
    if (!session || !session.currentQuestion || !sessionMeta) {
      return null;
    }
    const timeMs = Math.max(0, Math.round(performance.now() - sessionMeta.questionStartTs));
    const attempt = scoreAttempt({
      question: session.currentQuestion,
      userAnswer,
      timeMs,
      seed: session.seed,
      seedSource: session.seedSource,
      mode: session.mode,
      tempo: get().settings.tempo,
      flash: get().settings.flashEnabled,
      hintUsed,
      isAssisted
    });

    const results = [...session.results, attempt];
    const attempts = [attempt, ...get().attempts].slice(0, MAX_ATTEMPTS);
    const settings = get().settings;
    const config = createSessionConfig(
      session.mode,
      session.seed,
      session.seedSource,
      settings,
      session.startTs
    );
    const lastMoves = [...sessionMeta.lastMoves, attempt.moveId].slice(-2);
    const fixAnswered = session.fixAnswered + (isFixQuestion(session.currentQuestion) ? 1 : 0);

    let queue = session.queue;
    let generatedIndex = sessionMeta.generatedIndex;
    let nextQuestion: Question;

    if (queue.length > 0) {
      nextQuestion = queue[0];
      queue = queue.slice(1);
    } else {
      nextQuestion = generateQuestionAtIndex(config, generatedIndex, lastMoves);
      generatedIndex += 1;
    }

    set({
      session: {
        ...session,
        results,
        queue,
        fixAnswered,
        currentQuestion: nextQuestion
      },
      sessionMeta: {
        generatedIndex,
        lastMoves: [...lastMoves, nextQuestion.moveId].slice(-2),
        questionStartTs: performance.now()
      },
      attempts
    });

    saveAttempts(attempts);
    return attempt;
  },
  setCurrentQuestion: (question) => {
    const { session, sessionMeta } = get();
    if (!session || !sessionMeta) {
      return;
    }
    set({
      session: { ...session, currentQuestion: question },
      sessionMeta: { ...sessionMeta, questionStartTs: performance.now() }
    });
  },
  updateTimeLeft: (timeLeftMs) => {
    const { session } = get();
    if (!session) {
      return;
    }
    set({ session: { ...session, timeLeftMs } });
  }
}));
