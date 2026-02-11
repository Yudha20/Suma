import { describe, expect, it } from 'vitest';
import { migrateSettings } from '@/lib/storage/migrate';


describe('migrateSettings', () => {
  it('falls back to defaults on invalid input', () => {
    const settings = migrateSettings({ invalid: true });
    expect(settings.digitsMax).toBe(4);
    expect(settings.tempo).toBe('flow');
  });
});
