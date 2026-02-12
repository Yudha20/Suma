'use client';

import { useEffect, useRef } from 'react';
import { ConsoleShell } from '@/components/ConsoleShell';
import { ConsoleCard } from '@/components/ConsoleCard';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeSetupPanel } from '@/components/HomeSetupPanel';
import { HomeActionPanel } from '@/components/HomeActionPanel';
import { useHomeController } from '@/lib/hooks/useHomeController';

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    seedInput,
    setSeedInput,
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
  } = useHomeController();

  const isPhotoProcessing = photoStatus === 'processing';

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;

      if (!isEditable) {
        handleClipboardPaste(event);
        return;
      }

      const hasImage = Array.from(event.clipboardData?.items ?? []).some((item) =>
        item.type.startsWith('image/')
      );
      if (hasImage) {
        handleClipboardPaste(event);
      }
    };

    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('paste', onPaste);
    };
  }, [handleClipboardPaste]);

  return (
    <ConsoleShell>
      <HomeHeader />

      <ConsoleCard>
        <div className="flex flex-col gap-6">
          <HomeSetupPanel
            seedInput={seedInput}
            surpriseNote={surpriseNote}
            onSeedChange={setSeedInput}
            settings={settings}
            digitOptions={digitOptions}
            tempoOptions={tempoOptions}
            onDigitsChange={handleDigitsChange}
            onTempoChange={handleTempoChange}
            onBrightnessChange={handleBrightnessChange}
          />

          <HomeActionPanel
            onStart={handleStart}
            onSurprise={handleSurprise}
            onPhotoClick={() => fileInputRef.current?.click()}
            isPhotoProcessing={isPhotoProcessing}
            photoStatus={photoStatus}
            photoMessage={photoMessage}
            photoCandidates={photoCandidates}
            photoSwatches={photoSwatches}
            photoExplainability={photoExplainability}
          />
          <p className="text-xs text-text-dim">
            Tip: press Cmd+V or Ctrl+V to paste an image and start scanning instantly.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="a11y-sr"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              void handlePhotoFile(file);
              event.currentTarget.value = '';
            }}
          />
        </div>
      </ConsoleCard>
    </ConsoleShell>
  );
}
