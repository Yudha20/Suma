'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/state/store';
import { getSessionDurationMs, isFixQuestion } from '@/lib/session/engine';
import { getSummary } from '@/lib/session/scoring';
import { logEvent } from '@/lib/metrics/logger';

type AnswerFeedback = 'idle' | 'correct' | 'wrong';

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
  const autoSubmitTimerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);
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
    setAnswer('');
    setFeedback('idle');
    if (session?.currentQuestion) {
      logEvent('question_shown', { moveId: session.currentQuestion.moveId });
    }
  }, [session?.currentQuestion?.id]);

  const submitAnswer = (value: string) => {
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

    setFeedback(isCorrect ? 'correct' : 'wrong');
    logEvent('answer_submitted', { moveId });

    // Keep feedback visible briefly, then advance by recording the attempt.
    window.clearTimeout(feedbackTimerRef.current ?? undefined);
    feedbackTimerRef.current = window.setTimeout(() => {
      const attempt = answerCurrent(value, false, false);
      if (attempt) {
        logEvent(attempt.isCorrect ? 'answer_correct' : 'answer_incorrect', { moveId: attempt.moveId });
      }
      setAnswer('');
      setFeedback('idle');
      isSubmittingRef.current = false;
    }, 140);
  };

  const handleSubmit = () => {
    submitAnswer(answer);
  };

  const handleAnswerChange = (value: string) => {
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
    };
  }, []);

  const handleExit = () => {
    endSession();
    router.push('/');
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

  return {
    session,
    answer,
    setAnswer: handleAnswerChange,
    handleSubmit,
    handleExit,
    summary,
    showSummary,
    currentFixIndex,
    feedback
  } as const;
}
