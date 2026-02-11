import { SeedInput } from '@/components/SeedInput';
import { SegmentedControl } from '@/components/SegmentedControl';
import type { Settings, Tempo } from '@/lib/types';

export function HomeSetupPanel({
  seedInput,
  surpriseNote,
  onSeedChange,
  settings,
  digitOptions,
  tempoOptions,
  onDigitsChange,
  onTempoChange,
  onBrightnessChange
}: {
  seedInput: string;
  surpriseNote: string | null;
  onSeedChange: (value: string) => void;
  settings: Settings;
  digitOptions: Settings['digitsMax'][];
  tempoOptions: Tempo[];
  onDigitsChange: (digitsMax: Settings['digitsMax']) => void;
  onTempoChange: (tempo: Tempo) => void;
  onBrightnessChange: (brightnessTweak: number) => void;
}) {
  return (
    <>
      <SeedInput value={seedInput} onChange={onSeedChange} note={surpriseNote} />

      <div className="grid gap-6 sm:grid-cols-2">
        <SegmentedControl
          label="Digits"
          options={digitOptions.map((value) => ({ value, label: value }))}
          value={settings.digitsMax}
          onChange={onDigitsChange}
        />
        <SegmentedControl
          label="Tempo"
          options={tempoOptions.map((value) => ({ value, label: value }))}
          value={settings.tempo}
          onChange={onTempoChange}
        />
      </div>

      <div className="rounded-lg border border-consoleEdge bg-black/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="brightness" className="text-xs uppercase tracking-[0.2em] text-slate-400">
            Brightness tweak
          </label>
          <span className="text-xs text-slate-300 geist-mono">{settings.brightnessTweak}</span>
        </div>
        <input
          id="brightness"
          type="range"
          min={-40}
          max={40}
          step={1}
          value={settings.brightnessTweak}
          onChange={(event) => onBrightnessChange(Number(event.target.value))}
          className="mt-3 h-10 w-full"
        />
      </div>
    </>
  );
}
