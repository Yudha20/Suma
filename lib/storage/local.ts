import type { Attempt, Settings } from '@/lib/types';
import type { EventName, EventPayload } from '@/lib/metrics/events';
import { getDefaultSettings } from '@/lib/state/defaults';
import { migrateSettings, migrateAttempts } from '@/lib/storage/migrate';

const SETTINGS_KEY = 'miw.settings.v1';
const ATTEMPTS_KEY = 'miw.attempts.v1';
const EVENTS_KEY = 'miw.events.v1';

export type StoredEvent = {
  name: EventName;
  ts: number;
  payload: EventPayload;
};

let settingsWriteTimeout: number | undefined;
let attemptsWriteTimeout: number | undefined;

export function loadSettings(): Settings {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return getDefaultSettings();
    }
    const parsed = JSON.parse(raw) as unknown;
    return migrateSettings(parsed);
  } catch (error) {
    console.warn('Failed to load settings', error);
    return getDefaultSettings();
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.clearTimeout(settingsWriteTimeout);
  settingsWriteTimeout = window.setTimeout(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings', error);
    }
  }, 200);
}

export function loadAttempts(): Attempt[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return migrateAttempts(parsed);
  } catch (error) {
    console.warn('Failed to load attempts', error);
    return [];
  }
}

export function loadEvents(): StoredEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredEvent[]) : [];
  } catch (error) {
    console.warn('Failed to load events', error);
    return [];
  }
}

export function appendEvent(name: EventName, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const events = loadEvents();
    events.unshift({ name, ts: Date.now(), payload });
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(0, 200)));
  } catch (error) {
    console.warn('Failed to log event', error);
  }
}

export function saveAttempts(attempts: Attempt[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.clearTimeout(attemptsWriteTimeout);
  attemptsWriteTimeout = window.setTimeout(() => {
    try {
      window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
    } catch (error) {
      console.warn('Failed to save attempts', error);
    }
  }, 300);
}
