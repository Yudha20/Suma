import type { EventName, EventPayload } from '@/lib/metrics/events';
import { appendEvent } from '@/lib/storage/local';

export function logEvent(name: EventName, payload: EventPayload = {}): void {
  appendEvent(name, payload);
}
