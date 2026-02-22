'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/state/store';
import { getSessionDurationMs, isFixQuestion } from '@/lib/session/engine';
import { getSummary } from '@/lib/session/scoring';
import { logEvent } from '@/lib/metrics/logger';
import type { SessionMode } from '@/lib/types';

type AnswerFeedback = 'idle' | 'correct' | 'wrong';

function getMaxReveals(mode: SessionMode): number | null {
  switch (mode) {
    case 'sprint60':
      return 2;
    case 'session120':
      return 4;
    case 'fix':
      return null;
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}

export function useTrainController() {
  const router = useRouter();
  const {
    session,
    updateTimeLeft,
    answerCurrent,
    endSession,
    hydrate,
    hydrated
  } = useAppStore();

  const [answer, setAnswer] = useState('');
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [feedback, setFeedback] = useState<AnswerFeedback>('idle');
  const [hintUsed, setHintUsed] = useState(false);
  const [revealsUsed, setRevealsUsed] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const autoSubmitTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const duration = getSessionDurationMs(session.mode);
    const startTs = session.startTs;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTs;
      const nextLeft = Math.max(0, duration - elapsed);
      updateTimeLeft(nextLeft);
      if (nextLeft <= 0) {
        window.clearInterval(interval);
        setSummaryVisible(true);
        logEvent('session_completed', { mode: session.mode });
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [session?.mode, session?.startTs, updateTimeLeft]);

  useEffect(() => {
    if (session) {
      setRevealsUsed(0);
      setHintUsed(false);
      setRevealedAnswer(null);
      setSummaryVisible(false);
    }
  }, [session?.startTs]);

  useEffect(() => {
    setAnswer('');
    setFeedback('idle');
    setHintUsed(false);
    setRevealedAnswer(null);
    if (session?.currentQuestion) {
      logEvent('question_shown', { moveId: session.currentQuestion.moveId });
    }
  }, [session?.currentQuestion?.id]);

  const submitAnswer = (value: string, flags?: { hintUsed?: boolean; isAssisted?: boolean }) => {
    if (!session || !session.currentQuestion) {
      return;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return;
    }
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;

    const moveId = session.currentQuestion.moveId;
    const expected = session.currentQuestion.answer;
    const normalized = trimmed.toLowerCase();
    const parsed = Number(trimmed);
    const isValid = Number.isFinite(parsed);
    const isCorrect = normalized !== 'idk' && isValid && parsed === expected;
    const hintFlag = flags?.hintUsed ?? hintUsed;
    const assistedFlag = flags?.isAssisted ?? revealedAnswer !== null;

    setFeedback(isCorrect ? 'correct' : 'wrong');
    logEvent('answer_submitted', { moveId });

    // Keep feedback visible briefly, then advance by recording the attempt.
    window.clearTimeout(feedbackTimerRef.current ?? undefined);
    feedbackTimerRef.current = window.setTimeout(() => {
      const attempt = answerCurrent(value, hintFlag, assistedFlag);
      if (attempt) {
        logEvent(attempt.isCorrect ? 'answer_correct' : 'answer_incorrect', { moveId: attempt.moveId });
        if (assistedFlag) {
          logEvent('answer_assisted', { moveId: attempt.moveId });
        }
      }
      setAnswer('');
      setFeedback('idle');
      setRevealedAnswer(null);
      isSubmittingRef.current = false;
    }, 140);
  };

  const handleSubmit = () => {
    submitAnswer(answer);
  };

  const handleAnswerChange = (value: string) => {
    window.clearTimeout(revealTimerRef.current ?? undefined);
    revealTimerRef.current = null;

    setAnswer(value);
    setFeedback('idle');

    if (!session?.currentQuestion) {
      return;
    }
    if (summaryVisible) {
      return;
    }

    const trimmed = value.trim();
    const normalized = trimmed.toLowerCase();
    window.clearTimeout(autoSubmitTimerRef.current ?? undefined);
    autoSubmitTimerRef.current = null;

    if (trimmed.length === 0) {
      return;
    }

    if (normalized === 'idk') {
      submitAnswer(value);
      return;
    }

    // Auto-submit on exact correctness immediately, otherwise submit after a short pause.
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed) && parsed === session.currentQuestion.answer) {
      submitAnswer(value);
      return;
    }

    autoSubmitTimerRef.current = window.setTimeout(() => {
      submitAnswer(value);
    }, 650);
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(autoSubmitTimerRef.current ?? undefined);
      window.clearTimeout(feedbackTimerRef.current ?? undefined);
      window.clearTimeout(revealTimerRef.current ?? undefined);
    };
  }, []);

  const handleExit = () => {
    endSession();
    router.push('/');
  };

  const handleHint = () => {
    if (!session?.currentQuestion || hintUsed || summaryVisible) {
      return;
    }
    setHintUsed(true);
    logEvent('hint_used', { moveId: session.currentQuestion.moveId });
  };

  const handleReveal = () => {
    if (!session?.currentQuestion || summaryVisible) {
      return;
    }
    const maxReveals = getMaxReveals(session.mode);
    if (maxReveals !== null && revealsUsed >= maxReveals) {
      return;
    }
    if (isSubmittingRef.current) {
      return;
    }

    if (!hintUsed) {
      setHintUsed(true);
      logEvent('hint_used', { moveId: session.currentQuestion.moveId });
    }

    const answerString = String(session.currentQuestion.answer);
    setRevealsUsed((prev) => prev + 1);
    setRevealedAnswer(answerString);
    setAnswer(answerString);
    logEvent('reveal_used', { moveId: session.currentQuestion.moveId });

    window.clearTimeout(autoSubmitTimerRef.current ?? undefined);
    window.clearTimeout(feedbackTimerRef.current ?? undefined);
    window.clearTimeout(revealTimerRef.current ?? undefined);
    revealTimerRef.current = window.setTimeout(() => {
      submitAnswer(answerString, { hintUsed: true, isAssisted: true });
    }, 450);
  };

  const summary = useMemo(() => {
    if (!session) {
      return null;
    }
    return getSummary(session.results);
  }, [session]);

  const showSummary = summaryVisible && (session?.results.length ?? 0) > 0;
  const currentFixIndex = session && session.currentQuestion && isFixQuestion(session.currentQuestion)
    ? session.fixAnswered + 1
    : session?.fixAnswered ?? 0;
  const maxReveals = session ? getMaxReveals(session.mode) : null;

  return {
    session,
    answer,
    setAnswer: handleAnswerChange,
    handleSubmit,
    handleExit,
    handleHint,
    handleReveal,
    summary,
    showSummary,
    currentFixIndex,
    feedback,
    hintUsed,
    revealsUsed,
    maxReveals,
    revealedAnswer
  } as const;
}
