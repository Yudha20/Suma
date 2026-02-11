import type { SeedSource } from '@/lib/types';

export type PhotoStatus = 'idle' | 'processing' | 'done' | 'error';

export type Swatch = {
  r: number;
  g: number;
  b: number;
  hex: string;
  prominence: number;
  hue: number;
  lightness: number;
};

export type ExplainBlock = {
  title: string;
  lines: string[];
};

export type OcrCandidate = {
  digits: string;
  confidence: number;
  source?: 'text-detector' | 'tesseract';
};

export type PhotoSeedResult = {
  seed: string;
  seedSource: SeedSource;
  status: 'done' | 'fallback';
  photoCandidates: string[];
  paletteSwatches: Swatch[];
  explainability: ExplainBlock[];
  message: string;
};
