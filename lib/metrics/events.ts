export type EventName =
  | 'session_started'
  | 'seed_source_selected'
  | 'question_shown'
  | 'answer_submitted'
  | 'answer_correct'
  | 'answer_incorrect'
  | 'answer_assisted'
  | 'hint_used'
  | 'reveal_used'
  | 'flash_enabled'
  | 'session_completed';

export type EventPayload = Record<string, string | number | boolean | null>;
