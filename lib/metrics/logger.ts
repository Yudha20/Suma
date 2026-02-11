import type { EventName, EventPayload } from '@/lib/metrics/events';

const EVENT_KEY = 'miw.events.v1';

export function logEvent(name: EventName, payload: EventPayload = {}): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const raw = window.localStorage.getItem(EVENT_KEY);
    const events: Array<{ name: EventName; ts: number; payload: EventPayload }> = raw
      ? (JSON.parse(raw) as Array<{ name: EventName; ts: number; payload: EventPayload }>)
      : [];
    events.unshift({ name, ts: Date.now(), payload });
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(0, 200)));
  } catch (error) {
    console.warn('Failed to log event', error);
  }
}
