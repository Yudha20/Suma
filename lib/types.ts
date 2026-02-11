export type Tempo = 'calm' | 'fast' | 'flow';
export type SessionMode = 'sprint60' | 'session120' | 'fix';
export type SeedSource = 'auto' | 'typed' | 'surprise' | 'photo-ocr' | 'photo-palette';

export type MoveId =
  | 'add'
  | 'sub'
  | 'mul'
  | 'div'
  | 'split'
  | 'gst18'
  | 'round'
  | 'next1000';

export type TemplateId = MoveId;

export type Question = {
  id: string;
  moveId: MoveId;
  templateId: TemplateId;
  prompt: string;
  answer: number;
};

export type Attempt = {
  id: string;
  ts: number;
  seed: string;
  seedSource: SeedSource;
  mode: SessionMode;
  tempo: Tempo;
  flash: boolean;
  moveId: MoveId;
  templateId: TemplateId;
  prompt: string;
  answer: number;
  userAnswer: string;
  isCorrect: boolean;
  isAssisted: boolean;
  hintUsed: boolean;
  timeMs: number;
};

export type SessionSummary = {
  total: number;
  correct: number;
  accuracy: number;
  avgTimeMs: number;
};

export type Settings = {
  digitsMax: 2 | 3 | 4 | 6 | 8;
  tempo: Tempo;
  flashEnabled: boolean;
  flashMs: number;
  movesEnabled: MoveId[];
  sttEnabled: boolean;
  brightnessTweak: number;
};

export type SessionState = {
  mode: SessionMode;
  seed: string;
  seedSource: SeedSource;
  startTs: number;
  timeLeftMs: number;
  currentQuestion?: Question;
  queue: Question[];
  fixTotal: number;
  fixAnswered: number;
  results: Attempt[];
};
