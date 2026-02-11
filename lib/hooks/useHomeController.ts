'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/state/store';
import { generateWeightedSeed, sanitizeSeed } from '@/lib/session/engine';
import { logEvent } from '@/lib/metrics/logger';
import { processPhotoForSeed } from '@/lib/photo/pipeline';
import type { ExplainBlock, PhotoStatus, Swatch } from '@/lib/photo/types';
import type { SeedSource, SessionMode, Settings, Tempo } from '@/lib/types';

const tempoOptions: Tempo[] = ['calm', 'flow', 'fast'];
const digitOptions: Settings['digitsMax'][] = [2, 3, 4, 6, 8];

const surpriseNotes = [
  'From a bus ticket you found.',
  'A receipt total from today.',
  'A transit sign you walked past.'
];

export function useHomeController() {
  const router = useRouter();
  const { settings, setSettings, startSession, hydrate, hydrated } = useAppStore();

  const [seedInput, setSeedInput] = useState('');
  const [surpriseNote, setSurpriseNote] = useState<string | null>(null);
  const [seedSourceOverride, setSeedSourceOverride] = useState<SeedSource | null>(null);

  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>('idle');
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [photoCandidates, setPhotoCandidates] = useState<string[]>([]);
  const [photoSwatches, setPhotoSwatches] = useState<Swatch[]>([]);
  const [photoExplainability, setPhotoExplainability] = useState<ExplainBlock[]>([]);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrated, hydrate]);

  const start = (mode: SessionMode, seed: string, seedSource: SeedSource) => {
    logEvent('seed_source_selected', { seedSource });
    logEvent('session_started', { mode });
    startSession(mode, seed, seedSource);
    router.push('/train');
  };

  const handleStart = (mode: SessionMode) => {
    const sanitized = sanitizeSeed(seedInput);
    if (sanitized) {
      const seedSource = seedSourceOverride ?? 'typed';
      start(mode, sanitized, seedSource);
      return;
    }
    const seed = generateWeightedSeed();
    start(mode, seed, 'auto');
  };

  const handleSurprise = () => {
    const seed = generateWeightedSeed();
    const note = surpriseNotes[Math.floor(Math.random() * surpriseNotes.length)];
    setSeedInput(seed);
    setSurpriseNote(note);
    setSeedSourceOverride('surprise');
    setPhotoStatus('idle');
    setPhotoMessage(null);
    setPhotoCandidates([]);
    setPhotoSwatches([]);
    setPhotoExplainability([]);
    logEvent('seed_source_selected', { seedSource: 'surprise' });
  };

  const handlePhotoFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    setPhotoStatus('processing');
    setPhotoMessage('Scanning image...');
    setPhotoCandidates([]);
    setPhotoSwatches([]);
    setPhotoExplainability([]);

    const result = await processPhotoForSeed(file, {
      brightnessTweak: settings.brightnessTweak,
      ocrTimeoutMs: 6000,
      paletteTimeoutMs: 1200
    });

    setSeedInput(result.seed);
    setSeedSourceOverride(result.seedSource);
    setSurpriseNote(result.message);
    setPhotoCandidates(result.photoCandidates);
    setPhotoSwatches(result.paletteSwatches);
    setPhotoExplainability(result.explainability);
    setPhotoMessage(result.message);
    setPhotoStatus(result.status === 'done' ? 'done' : 'error');

    logEvent('seed_source_selected', { seedSource: result.seedSource });
  };

  const handleClipboardPaste = (event: ClipboardEvent): boolean => {
    const clipboard = event.clipboardData;
    if (!clipboard) {
      return false;
    }

    const imageItem = Array.from(clipboard.items).find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        event.preventDefault();
        void handlePhotoFile(file);
        return true;
      }
    }

    const text = clipboard.getData('text').trim();
    const sanitized = sanitizeSeed(text);
    if (sanitized) {
      event.preventDefault();
      setSeedInput(sanitized);
      setSeedSourceOverride('typed');
      setSurpriseNote('Seed pasted from clipboard.');
      setPhotoStatus('idle');
      setPhotoMessage(null);
      setPhotoCandidates([]);
      setPhotoSwatches([]);
      setPhotoExplainability([]);
      return true;
    }

    return false;
  };

  const handleSeedChange = (value: string) => {
    setSeedInput(value);
    setSurpriseNote(null);
    setSeedSourceOverride(null);
  };

  const handleDigitsChange = (digitsMax: Settings['digitsMax']) => {
    setSettings({ digitsMax });
  };

  const handleTempoChange = (tempo: Tempo) => {
    setSettings({ tempo });
  };

  const handleBrightnessChange = (brightnessTweak: number) => {
    setSettings({ brightnessTweak });
  };

  return {
    seedInput,
    setSeedInput: handleSeedChange,
    surpriseNote,
    handleStart,
    handleSurprise,
    handlePhotoFile,
    handleClipboardPaste,
    tempoOptions,
    digitOptions,
    settings,
    handleDigitsChange,
    handleTempoChange,
    handleBrightnessChange,
    photoStatus,
    photoMessage,
    photoCandidates,
    photoSwatches,
    photoExplainability
  } as const;
}
