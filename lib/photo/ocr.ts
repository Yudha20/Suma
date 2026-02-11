import type { OcrCandidate } from '@/lib/photo/types';

type TextBlock = {
  rawValue?: string;
};

type TextDetectorInstance = {
  detect: (source: HTMLCanvasElement) => Promise<TextBlock[]>;
};

type TextDetectorConstructor = new () => TextDetectorInstance;
type TesseractResult = {
  data?: {
    text?: string;
    confidence?: number;
  };
};

type TesseractLike = {
  recognize: (
    source: HTMLCanvasElement,
    language: string,
    options?: Record<string, unknown>
  ) => Promise<TesseractResult>;
};

type GlobalWithOcr = typeof globalThis & {
  TextDetector?: unknown;
  Tesseract?: TesseractLike;
  __sumaTesseractLoader?: Promise<TesseractLike>;
};

const TESSERACT_CDNS = [
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js'
];

export type OcrRunResult = {
  candidates: OcrCandidate[];
  diagnostics: string[];
};

function getTextDetector(): TextDetectorConstructor | null {
  const globalWithDetector = globalThis as GlobalWithOcr;
  const detector = globalWithDetector.TextDetector;
  if (typeof detector !== 'function') {
    return null;
  }
  return detector as TextDetectorConstructor;
}

export async function extractOcrCandidates(
  canvas: HTMLCanvasElement,
  timeoutMs: number
): Promise<OcrCandidate[]> {
  const result = await extractOcrCandidatesDetailed(canvas, timeoutMs);
  return result.candidates;
}

export async function extractOcrCandidatesDetailed(
  canvas: HTMLCanvasElement,
  timeoutMs: number
): Promise<OcrRunResult> {
  const candidates = new Map<string, OcrCandidate>();
  const diagnostics: string[] = [];

  const textDetectorCandidates = await extractWithTextDetector(canvas, timeoutMs).catch((error: unknown) => {
    diagnostics.push(formatError('TextDetector', error));
    return [];
  });
  if (textDetectorCandidates.length > 0) {
    diagnostics.push(`TextDetector found ${textDetectorCandidates.length} candidate(s).`);
  } else {
    diagnostics.push('TextDetector found no valid digit groups.');
  }

  for (const candidate of textDetectorCandidates) {
    const previous = candidates.get(candidate.digits);
    if (!previous || candidate.confidence > previous.confidence) {
      candidates.set(candidate.digits, candidate);
    }
  }

  if (candidates.size === 0) {
    const gridCandidates = await extractWithTextDetectorGrid(canvas, timeoutMs).catch((error: unknown) => {
      diagnostics.push(formatError('TextDetector grid pass', error));
      return [];
    });
    if (gridCandidates.length > 0) {
      diagnostics.push(`TextDetector grid pass found ${gridCandidates.length} candidate(s).`);
    } else {
      diagnostics.push('TextDetector grid pass found no valid digit groups.');
    }

    for (const candidate of gridCandidates) {
      const previous = candidates.get(candidate.digits);
      if (!previous || candidate.confidence > previous.confidence) {
        candidates.set(candidate.digits, candidate);
      }
    }
  }

  if (candidates.size === 0) {
    const tesseractCandidates = await extractWithTesseract(canvas, Math.max(1200, timeoutMs)).catch((error: unknown) => {
      diagnostics.push(formatError('Tesseract', error));
      return [];
    });
    if (tesseractCandidates.length > 0) {
      diagnostics.push(`Tesseract found ${tesseractCandidates.length} candidate(s).`);
    } else {
      diagnostics.push('Tesseract found no valid digit groups.');
    }

    for (const candidate of tesseractCandidates) {
      const previous = candidates.get(candidate.digits);
      if (!previous || candidate.confidence > previous.confidence) {
        candidates.set(candidate.digits, candidate);
      }
    }
  }

  const sorted = Array.from(candidates.values())
    .sort((a, b) => {
      if (b.digits.length !== a.digits.length) {
        return b.digits.length - a.digits.length;
      }
      return b.confidence - a.confidence;
    });

  return {
    candidates: sorted,
    diagnostics
  };
}

export function pickBestOcrCandidate(candidates: OcrCandidate[]): OcrCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  const valid = candidates.filter((candidate) => /^\d{2,8}$/.test(candidate.digits));
  if (valid.length === 0) {
    return null;
  }

  valid.sort((a, b) => {
    const scoreDiff = scoreCandidate(b) - scoreCandidate(a);
    if (Math.abs(scoreDiff) > 0.0001) {
      return scoreDiff;
    }
    if (b.digits.length !== a.digits.length) {
      return b.digits.length - a.digits.length;
    }
    return b.confidence - a.confidence;
  });

  return valid[0];
}

export function extractDigitsFromText(text: string): string[] {
  const outputs = new Set<string>();
  const normalizedText = text.replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
  const compactMatches = text.match(/\d{2,8}/g) ?? [];
  for (const match of compactMatches) {
    if (/^\d{2,8}$/.test(match)) {
      outputs.add(match);
    }
  }

  const noisyMatches = normalizedText.match(/\d[\d\s\-.,/|]{0,120}\d/g) ?? [];
  for (const match of noisyMatches) {
    const normalized = match.replace(/\D/g, '');
    if (/^\d{2,8}$/.test(normalized)) {
      outputs.add(normalized);
    }
  }

  const tokenized = tokenizeDigitsWithIndices(normalizedText);
  for (const candidate of mergeNeighborDigitTokens(normalizedText, tokenized)) {
    if (/^\d{2,8}$/.test(candidate)) {
      outputs.add(candidate);
    }
  }

  return Array.from(outputs);
}

type DigitToken = {
  value: string;
  start: number;
  end: number;
};

function tokenizeDigitsWithIndices(text: string): DigitToken[] {
  const tokens: DigitToken[] = [];
  const regex = /\d+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      value: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return tokens;
}

function mergeNeighborDigitTokens(text: string, tokens: DigitToken[]): string[] {
  const merged = new Set<string>();

  for (let start = 0; start < tokens.length; start += 1) {
    let value = tokens[start].value;
    addCandidateSlices(merged, value);

    for (let end = start + 1; end < tokens.length; end += 1) {
      const between = text.slice(tokens[end - 1].end, tokens[end].start);
      if (!isMergeableSeparator(between)) {
        break;
      }

      value += tokens[end].value;
      addCandidateSlices(merged, value);

      if (value.length >= 12) {
        break;
      }
    }
  }

  return Array.from(merged);
}

function addCandidateSlices(output: Set<string>, digits: string): void {
  if (digits.length >= 2 && digits.length <= 8) {
    output.add(digits);
    return;
  }

  if (digits.length > 8) {
    for (let start = 0; start <= digits.length - 8; start += 1) {
      output.add(digits.slice(start, start + 8));
    }
  }
}

function isMergeableSeparator(separator: string): boolean {
  if (separator.length > 8) {
    return false;
  }

  if (/[A-Za-z]/.test(separator)) {
    return false;
  }

  return /^[\s,./|:-]*$/.test(separator);
}

function scoreCandidate(candidate: OcrCandidate): number {
  const lengthScoreByDigits: Record<number, number> = {
    2: 0.1,
    3: 0.45,
    4: 0.72,
    5: 0.92,
    6: 1,
    7: 0.95,
    8: 0.85
  };
  const lengthScore = lengthScoreByDigits[candidate.digits.length] ?? 0.4;
  const uniqueDigits = new Set(candidate.digits.split('')).size;
  const diversity = uniqueDigits / candidate.digits.length;
  const sourceBoost = candidate.source === 'text-detector' ? 0.02 : 0;
  return candidate.confidence * 0.35 + lengthScore * 0.55 + diversity * 0.08 + sourceBoost;
}

async function extractWithTextDetector(
  canvas: HTMLCanvasElement,
  timeoutMs: number
): Promise<OcrCandidate[]> {
  const TextDetectorCtor = getTextDetector();
  if (!TextDetectorCtor) {
    return [];
  }

  const detector = new TextDetectorCtor();
  const blocks = await withTimeout(detector.detect(canvas), timeoutMs, 'OCR timed out');
  const candidates = new Map<string, OcrCandidate>();

  for (const block of blocks) {
    const raw = block.rawValue ?? '';
    const digits = extractDigitsFromText(raw);
    for (const value of digits) {
      const confidence = Math.min(0.99, 0.45 + value.length / 12);
      const previous = candidates.get(value);
      if (!previous || confidence > previous.confidence) {
        candidates.set(value, {
          digits: value,
          confidence,
          source: 'text-detector'
        });
      }
    }
  }

  return Array.from(candidates.values());
}

async function extractWithTextDetectorGrid(
  canvas: HTMLCanvasElement,
  timeoutMs: number
): Promise<OcrCandidate[]> {
  const TextDetectorCtor = getTextDetector();
  if (!TextDetectorCtor) {
    return [];
  }

  const regions = buildGridRegions(canvas.width, canvas.height);
  const perRegionTimeoutMs = Math.max(220, Math.min(900, Math.floor(timeoutMs / Math.max(1, regions.length))));
  const merged = new Map<string, OcrCandidate>();

  for (const region of regions) {
    const regionCanvas = cropAndUpscaleRegion(canvas, region.x, region.y, region.width, region.height);
    const regionCandidates = await extractWithTextDetector(regionCanvas, perRegionTimeoutMs).catch(() => []);

    for (const candidate of regionCandidates) {
      const confidence = Math.max(0.05, Math.min(0.99, candidate.confidence - 0.03));
      const nextCandidate: OcrCandidate = {
        ...candidate,
        confidence
      };
      const previous = merged.get(nextCandidate.digits);
      if (!previous || nextCandidate.confidence > previous.confidence) {
        merged.set(nextCandidate.digits, nextCandidate);
      }
    }

    if (hasStrongCandidate(merged)) {
      break;
    }
  }

  return Array.from(merged.values());
}

async function extractWithTesseract(
  canvas: HTMLCanvasElement,
  timeoutMs: number
): Promise<OcrCandidate[]> {
  const tesseract = await loadTesseract();
  const result = await withTimeout(
    tesseract.recognize(canvas, 'eng', {
      tessedit_char_whitelist: '0123456789',
      preserve_interword_spaces: '1'
    }),
    timeoutMs,
    'Tesseract OCR timed out'
  );

  const text = result.data?.text ?? '';
  const baseConfidence = Math.max(0.1, Math.min(0.99, (result.data?.confidence ?? 0) / 100));
  const digits = extractDigitsFromText(text);

  return digits.map((value) => ({
    digits: value,
    confidence: Math.min(0.99, baseConfidence + value.length / 30),
    source: 'tesseract'
  }));
}

type GridRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function buildGridRegions(width: number, height: number): GridRegion[] {
  if (width < 2 || height < 2) {
    return [{ x: 0, y: 0, width: Math.max(1, width), height: Math.max(1, height) }];
  }

  const columns = 3;
  const rows = 2;
  const overlapRatio = 0.2;
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const overlapX = cellWidth * overlapRatio;
  const overlapY = cellHeight * overlapRatio;
  const regions: GridRegion[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x0 = Math.max(0, Math.floor(col * cellWidth - (col > 0 ? overlapX / 2 : 0)));
      const y0 = Math.max(0, Math.floor(row * cellHeight - (row > 0 ? overlapY / 2 : 0)));
      const x1 = Math.min(width, Math.ceil((col + 1) * cellWidth + (col < columns - 1 ? overlapX / 2 : 0)));
      const y1 = Math.min(height, Math.ceil((row + 1) * cellHeight + (row < rows - 1 ? overlapY / 2 : 0)));
      regions.push({
        x: x0,
        y: y0,
        width: Math.max(1, x1 - x0),
        height: Math.max(1, y1 - y0)
      });
    }
  }

  regions.push({
    x: 0,
    y: Math.floor(height * 0.5),
    width,
    height: Math.max(1, height - Math.floor(height * 0.5))
  });

  return regions;
}

function cropAndUpscaleRegion(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): HTMLCanvasElement {
  const regionCanvas = document.createElement('canvas');
  const baseMax = Math.max(width, height);
  const scale = Math.max(1, Math.min(3, 960 / Math.max(1, baseMax)));
  regionCanvas.width = Math.max(1, Math.round(width * scale));
  regionCanvas.height = Math.max(1, Math.round(height * scale));

  const ctx = regionCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return sourceCanvas;
  }

  ctx.drawImage(sourceCanvas, x, y, width, height, 0, 0, regionCanvas.width, regionCanvas.height);
  return regionCanvas;
}

function hasStrongCandidate(candidates: Map<string, OcrCandidate>): boolean {
  for (const candidate of candidates.values()) {
    if (candidate.digits.length >= 5) {
      return true;
    }
  }
  return false;
}

async function loadTesseract(): Promise<TesseractLike> {
  const globalWithOcr = globalThis as GlobalWithOcr;
  if (globalWithOcr.Tesseract) {
    return globalWithOcr.Tesseract;
  }

  if (globalWithOcr.__sumaTesseractLoader) {
    return globalWithOcr.__sumaTesseractLoader;
  }

  globalWithOcr.__sumaTesseractLoader = loadTesseractFromAnyCdn(globalWithOcr);

  try {
    return await globalWithOcr.__sumaTesseractLoader;
  } finally {
    globalWithOcr.__sumaTesseractLoader = undefined;
  }
}

async function loadTesseractFromAnyCdn(globalWithOcr: GlobalWithOcr): Promise<TesseractLike> {
  let lastError: unknown = null;

  for (const cdn of TESSERACT_CDNS) {
    try {
      const tesseract = await loadScriptAndGetTesseract(globalWithOcr, cdn);
      return tesseract;
    } catch (error: unknown) {
      lastError = error;
    }
  }

  throw new Error(`Failed to load Tesseract from all CDNs. Last error: ${stringifyError(lastError)}`);
}

async function loadScriptAndGetTesseract(
  globalWithOcr: GlobalWithOcr,
  source: string
): Promise<TesseractLike> {
  const existing = document.querySelector(`script[src="${source}"]`);
  if (existing && globalWithOcr.Tesseract) {
    return globalWithOcr.Tesseract;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    script.crossOrigin = 'anonymous';

    const timeoutId = window.setTimeout(() => {
      script.remove();
      reject(new Error(`Timed out loading script: ${source}`));
    }, 6000);

    script.onload = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      script.remove();
      reject(new Error(`Script load failed: ${source}`));
    };
    document.head.appendChild(script);
  });

  if (globalWithOcr.Tesseract) {
    return globalWithOcr.Tesseract;
  }
  throw new Error(`Script loaded but window.Tesseract was missing: ${source}`);
}

function formatError(engine: string, error: unknown): string {
  return `${engine} error: ${stringifyError(error)}`;
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}
