'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/state/store';
import { getSessionDurationMs, isFixQuestion } from '@/lib/session/engine';
import { getSummary } from '@/lib/session/scoring';
import { logEvent } from '@/lib/metrics/logger';

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
    if (session?.currentQuestion) {
      logEvent('question_shown', { moveId: session.currentQuestion.moveId });
    }
  }, [session?.currentQuestion?.id]);

  const handleSubmit = () => {
    if (!session || !session.currentQuestion) {
      return;
    }
    if (answer.trim().length === 0) {
      return;
    }
    const attempt = answerCurrent(answer, false, false);
    logEvent('answer_submitted', { moveId: session.currentQuestion.moveId });
    if (attempt) {
      logEvent(attempt.isCorrect ? 'answer_correct' : 'answer_incorrect', { moveId: attempt.moveId });
    }
    setAnswer('');
  };

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
    setAnswer,
    handleSubmit,
    handleExit,
    summary,
    showSummary,
    currentFixIndex
  } as const;
}
