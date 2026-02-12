import type { OcrCandidate } from '@/lib/photo/types';
import { recognizeDigits } from '@/lib/ocr/tesseractClient';

type TextBlock = {
  rawValue?: string;
};

type TextDetectorInstance = {
  detect: (source: HTMLCanvasElement) => Promise<TextBlock[]>;
};

type TextDetectorConstructor = new () => TextDetectorInstance;

const LOOKALIKE_DIGIT_MAP: Record<string, string> = {
  O: '0',
  o: '0',
  Q: '0',
  D: '0',
  U: '0',
  I: '1',
  l: '1',
  '|': '1',
  '!': '1',
  i: '1',
  Z: '2',
  z: '2',
  E: '3',
  A: '4',
  S: '5',
  s: '5',
  G: '6',
  T: '7',
  B: '8',
  g: '9',
  q: '9'
};

export type OcrRunResult = {
  candidates: OcrCandidate[];
  diagnostics: string[];
};

function getTextDetector(): TextDetectorConstructor | null {
  const detector = (globalThis as typeof globalThis & { TextDetector?: unknown }).TextDetector;
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

  if (candidates.size === 0 || !hasStrongCandidate(candidates)) {
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

  if (candidates.size === 0 || !hasHighQualityCandidate(candidates)) {
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
  } else {
    diagnostics.push('Skipped Tesseract because TextDetector produced a high-quality candidate.');
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

  const valid = candidates.filter((candidate) => /^\d{2,10}$/.test(candidate.digits));
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
  const normalizedText = normalizeLikelyDigitRuns(text);
  const compactMatches = text.match(/(?<!\d)\d{2,10}(?!\d)/g) ?? [];
  for (const match of compactMatches) {
    if (/^\d{2,10}$/.test(match)) {
      outputs.add(match);
    }
  }

  const noisyMatches = normalizedText.match(/(?<!\d)\d(?:[\s\-.,/|]{0,3}\d){1,9}(?!\d)/g) ?? [];
  for (const match of noisyMatches) {
    const normalized = match.replace(/\D/g, '');
    if (/^\d{2,10}$/.test(normalized)) {
      outputs.add(normalized);
    }
  }

  // Handle alphanumeric codes like "NC0219" — strip common letter prefixes and extract digits.
  const alphaNumericCodes = normalizedText.match(/[A-Za-z]{1,3}\d{2,10}/g) ?? [];
  for (const code of alphaNumericCodes) {
    const digitsOnly = code.replace(/[^0-9]/g, '');
    if (/^\d{2,10}$/.test(digitsOnly)) {
      outputs.add(digitsOnly);
    }
  }

  const tokenized = tokenizeDigitsWithIndices(normalizedText);
  for (const candidate of mergeNeighborDigitTokens(normalizedText, tokenized)) {
    if (/^\d{2,10}$/.test(candidate)) {
      outputs.add(candidate);
    }
  }

  return Array.from(outputs);
}

function normalizeLikelyDigitRuns(text: string): string {
  return text.replace(/[A-Za-z0-9|!]+/g, (token) => {
    if (!isLikelyDigitToken(token)) {
      return token;
    }

    let mapped = '';
    for (const char of token) {
      mapped += LOOKALIKE_DIGIT_MAP[char] ?? char;
    }
    return mapped;
  });
}

function isLikelyDigitToken(token: string): boolean {
  if (!/\d/.test(token)) {
    return false;
  }
  for (const char of token) {
    if (!/\d/.test(char) && !LOOKALIKE_DIGIT_MAP[char]) {
      return false;
    }
  }
  return true;
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

      if (value.length >= 14) {
        break;
      }
    }
  }

  return Array.from(merged);
}

function addCandidateSlices(output: Set<string>, digits: string): void {
  if (digits.length >= 2 && digits.length <= 10) {
    output.add(digits);
  }
}

function isMergeableSeparator(separator: string): boolean {
  if (separator.length > 3) {
    return false;
  }

  if (/[A-Za-z]/.test(separator)) {
    return false;
  }

  return /^[\s,./|:-]*$/.test(separator);
}

function scoreCandidate(candidate: OcrCandidate): number {
  const lengthScoreByDigits: Record<number, number> = {
    2: 0.28,
    3: 0.56,
    4: 0.72,
    5: 0.92,
    6: 1,
    7: 0.95,
    8: 0.85,
    9: 0.78,
    10: 0.72
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

  const variants = buildTextDetectorVariants(canvas);
  const perVariantTimeoutMs = Math.max(220, Math.floor(timeoutMs / Math.max(1, variants.length)));
  const candidates = new Map<string, OcrCandidate>();

  for (const variant of variants) {
    const detector = new TextDetectorCtor();
    const blocks = await withTimeout(
      detector.detect(variant.canvas),
      perVariantTimeoutMs,
      `OCR timed out (${variant.label})`
    ).catch(() => []);

    for (const block of blocks) {
      const raw = block.rawValue ?? '';
      const digits = extractDigitsFromText(raw);
      for (const value of digits) {
        const confidence = Math.min(0.99, 0.45 + value.length / 12 + variant.confidenceAdjust);
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
  const variants = buildTesseractVariants(canvas, timeoutMs);
  const perFastTimeoutMs = Math.max(550, Math.floor(timeoutMs / Math.max(1, variants.length + 1)));
  const merged = new Map<string, OcrCandidate>();

  for (const variant of variants) {
    const fast = await recognizeDigits(variant.canvas, {
      mode: 'fast',
      minLen: 2,
      maxLen: 8,
      timeoutMs: perFastTimeoutMs
    }).catch(() => null);

    if (!fast?.digits) {
      continue;
    }

    const normalizedConfidence = Math.max(0.12, Math.min(0.99, (fast.confidence ?? 45) / 100));
    const candidate: OcrCandidate = {
      digits: fast.digits,
      confidence: Math.min(0.99, normalizedConfidence + fast.digits.length / 28 + variant.confidenceAdjust),
      source: 'tesseract'
    };
    const previous = merged.get(candidate.digits);
    if (!previous || candidate.confidence > previous.confidence) {
      merged.set(candidate.digits, candidate);
    }
  }

  // Slower, higher-accuracy digits model: run only on demand.
  if (merged.size === 0 || !hasStrongCandidateFromMap(merged)) {
    const perDigitsTimeoutMs = Math.max(900, Math.floor((timeoutMs * 1.35) / Math.max(1, variants.length + 1)));
    for (const variant of variants) {
      const digitsModel = await recognizeDigits(variant.canvas, {
        mode: 'digits',
        minLen: 2,
        maxLen: 8,
        timeoutMs: perDigitsTimeoutMs
      }).catch(() => null);

      if (!digitsModel?.digits) {
        continue;
      }

      const normalizedConfidence = Math.max(0.2, Math.min(0.99, (digitsModel.confidence ?? 55) / 100));
      const candidate: OcrCandidate = {
        digits: digitsModel.digits,
        confidence: Math.min(0.99, normalizedConfidence + digitsModel.digits.length / 24 + variant.confidenceAdjust + 0.05),
        source: 'tesseract'
      };
      const previous = merged.get(candidate.digits);
      if (!previous || candidate.confidence > previous.confidence) {
        merged.set(candidate.digits, candidate);
      }
    }
  }

  return Array.from(merged.values());
}

function hasStrongCandidateFromMap(candidates: Map<string, OcrCandidate>): boolean {
  for (const candidate of candidates.values()) {
    if (candidate.digits.length >= 4 && candidate.confidence >= 0.6) {
      return true;
    }
  }
  return false;
}

type TesseractVariant = {
  label: string;
  canvas: HTMLCanvasElement;
  confidenceAdjust: number;
};

function buildTesseractVariants(canvas: HTMLCanvasElement, timeoutMs: number): TesseractVariant[] {
  const variants: TesseractVariant[] = [{ label: 'base', canvas, confidenceAdjust: 0 }];
  const trimmedBottom = trimLikelyBottomBand(canvas);
  if (trimmedBottom !== canvas) {
    variants.push({
      label: 'trimmed-bottom',
      canvas: trimmedBottom,
      confidenceAdjust: 0.06
    });
  }

  const primaryBase = trimmedBottom !== canvas ? trimmedBottom : canvas;
  const denseCrop = cropDenseInkRegion(primaryBase);
  if (denseCrop !== primaryBase) {
    variants.push({
      label: 'dense-ink-crop',
      canvas: denseCrop,
      confidenceAdjust: 0.08
    });
  }

  const primary = denseCrop !== primaryBase ? denseCrop : primaryBase;
  const upscaled = timeoutMs >= 1800 ? scaleCanvas(primary, 2, 1800) : null;

  if (upscaled) {
    variants.push({
      label: 'upscaled',
      canvas: upscaled,
      confidenceAdjust: 0.03
    });
  }

  if (upscaled && timeoutMs >= 2600) {
    variants.push({
      label: 'inverted-upscaled',
      canvas: invertCanvas(upscaled),
      confidenceAdjust: 0.01
    });
  }

  return variants;
}

type TextDetectorVariant = {
  label: string;
  canvas: HTMLCanvasElement;
  confidenceAdjust: number;
};

function buildTextDetectorVariants(canvas: HTMLCanvasElement): TextDetectorVariant[] {
  const variants: TextDetectorVariant[] = [{ label: 'base', canvas, confidenceAdjust: 0 }];
  const trimmedBottom = trimLikelyBottomBand(canvas);
  if (trimmedBottom !== canvas) {
    variants.push({
      label: 'trimmed-bottom',
      canvas: trimmedBottom,
      confidenceAdjust: 0.05
    });
  }
  const denseCrop = cropDenseInkRegion(trimmedBottom !== canvas ? trimmedBottom : canvas);
  if (denseCrop !== canvas && denseCrop !== trimmedBottom) {
    variants.push({
      label: 'dense-ink-crop',
      canvas: denseCrop,
      confidenceAdjust: 0.07
    });
  }
  const centered = cropCenter(canvas, 0.86, 0.86);
  if (centered !== canvas) {
    variants.push({
      label: 'center-crop',
      canvas: centered,
      confidenceAdjust: 0.03
    });
  }
  // Sharpened variant: apply unsharp mask to help with blurry stock photos.
  const sharpened = sharpenCanvas(canvas);
  if (sharpened !== canvas) {
    variants.push({
      label: 'sharpened',
      canvas: sharpened,
      confidenceAdjust: 0.02
    });
  }
  return variants;
}

function scaleCanvas(source: HTMLCanvasElement, factor: number, maxDimension: number): HTMLCanvasElement {
  if (factor <= 1) {
    return source;
  }

  const width = source.width;
  const height = source.height;
  const scale = Math.min(factor, maxDimension / Math.max(1, Math.max(width, height)));
  if (!Number.isFinite(scale) || scale <= 1) {
    return source;
  }

  const scaled = document.createElement('canvas');
  scaled.width = Math.max(1, Math.round(width * scale));
  scaled.height = Math.max(1, Math.round(height * scale));
  const ctx = scaled.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return source;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, width, height, 0, 0, scaled.width, scaled.height);
  return scaled;
}

function invertCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const copy = document.createElement('canvas');
  copy.width = source.width;
  copy.height = source.height;
  const ctx = copy.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return source;
  }

  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, copy.width, copy.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }

  ctx.putImageData(imageData, 0, 0);
  return copy;
}

function trimLikelyBottomBand(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return source;
  }

  const width = source.width;
  const height = source.height;
  if (width < 8 || height < 8) {
    return source;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let bandHeight = 0;
  for (let y = height - 1; y >= 0; y -= 1) {
    let dark = 0;
    const offset = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const idx = offset + x * 4;
      if (data[idx] < 64) {
        dark += 1;
      }
    }
    const darkRatio = dark / width;
    if (darkRatio >= 0.75) {
      bandHeight += 1;
      continue;
    }
    if (bandHeight > 0) {
      break;
    }
  }

  const minBand = Math.max(6, Math.floor(height * 0.03));
  const maxBand = Math.max(minBand, Math.floor(height * 0.28));
  if (bandHeight < minBand || bandHeight > maxBand) {
    return source;
  }

  return cropCanvas(source, 0, 0, width, height - bandHeight);
}

function cropDenseInkRegion(source: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return source;
  }

  const width = source.width;
  const height = source.height;
  if (width < 24 || height < 24) {
    return source;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const rowCounts = new Array<number>(height).fill(0);
  const colCounts = new Array<number>(width).fill(0);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const idx = rowOffset + x * 4;
      if (data[idx] < 64) {
        rowCounts[y] += 1;
        colCounts[x] += 1;
      }
    }
  }

  const rowThreshold = Math.max(4, Math.floor(width * 0.012));
  const colThreshold = Math.max(4, Math.floor(height * 0.012));
  const yBand = findDominantBand(rowCounts, rowThreshold);
  const xBand = findDominantBand(colCounts, colThreshold);

  if (!yBand || !xBand) {
    return source;
  }

  const bandWidth = xBand.end - xBand.start + 1;
  const bandHeight = yBand.end - yBand.start + 1;
  if (bandWidth < Math.floor(width * 0.2) || bandHeight < Math.floor(height * 0.14)) {
    return source;
  }

  const padX = Math.max(6, Math.floor(bandWidth * 0.08));
  const padY = Math.max(6, Math.floor(bandHeight * 0.1));
  const x = Math.max(0, xBand.start - padX);
  const y = Math.max(0, yBand.start - padY);
  const w = Math.min(width - x, bandWidth + padX * 2);
  const h = Math.min(height - y, bandHeight + padY * 2);

  return cropCanvas(source, x, y, w, h);
}

function findDominantBand(values: number[], threshold: number): { start: number; end: number } | null {
  let bestStart = -1;
  let bestEnd = -1;
  let bestScore = 0;

  let start = -1;
  let score = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] >= threshold) {
      if (start < 0) {
        start = i;
        score = 0;
      }
      score += values[i];
      continue;
    }

    if (start >= 0) {
      if (score > bestScore) {
        bestScore = score;
        bestStart = start;
        bestEnd = i - 1;
      }
      start = -1;
      score = 0;
    }
  }

  if (start >= 0 && score > bestScore) {
    bestScore = score;
    bestStart = start;
    bestEnd = values.length - 1;
  }

  if (bestStart < 0 || bestEnd < bestStart) {
    return null;
  }
  return { start: bestStart, end: bestEnd };
}

function cropCenter(source: HTMLCanvasElement, widthRatio: number, heightRatio: number): HTMLCanvasElement {
  const width = source.width;
  const height = source.height;
  if (width < 16 || height < 16) {
    return source;
  }
  const targetWidth = Math.max(8, Math.floor(width * widthRatio));
  const targetHeight = Math.max(8, Math.floor(height * heightRatio));
  if (targetWidth >= width || targetHeight >= height) {
    return source;
  }
  const x = Math.floor((width - targetWidth) / 2);
  const y = Math.floor((height - targetHeight) / 2);
  return cropCanvas(source, x, y, targetWidth, targetHeight);
}

function cropCanvas(source: HTMLCanvasElement, x: number, y: number, width: number, height: number): HTMLCanvasElement {
  const safeWidth = Math.max(1, Math.min(source.width - x, width));
  const safeHeight = Math.max(1, Math.min(source.height - y, height));
  if (safeWidth >= source.width && safeHeight >= source.height) {
    return source;
  }

  const cropped = document.createElement('canvas');
  cropped.width = safeWidth;
  cropped.height = safeHeight;
  const ctx = cropped.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return source;
  }
  ctx.drawImage(source, x, y, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight);
  return cropped;
}

/**
 * Apply a 3×3 sharpen convolution kernel to enhance blurry digit edges.
 * Kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
 */
function sharpenCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const { width, height } = source;
  if (width < 8 || height < 8) return source;

  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) return source;

  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const outCtx = out.getContext('2d', { willReadFrequently: true });
  if (!outCtx) return source;

  const result = outCtx.createImageData(width, height);
  const dst = result.data;

  // Sharpen kernel: center = 5, cardinal neighbours = -1
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c += 1) {
        const val =
          5 * src[idx + c]
          - src[idx - width * 4 + c]  // up
          - src[idx + width * 4 + c]  // down
          - src[idx - 4 + c]          // left
          - src[idx + 4 + c];         // right
        dst[idx + c] = Math.max(0, Math.min(255, val));
      }
      dst[idx + 3] = src[idx + 3];
    }
  }
  // Copy border pixels as-is.
  for (let x = 0; x < width; x += 1) {
    for (const y of [0, height - 1]) {
      const idx = (y * width + x) * 4;
      dst[idx] = src[idx]; dst[idx + 1] = src[idx + 1];
      dst[idx + 2] = src[idx + 2]; dst[idx + 3] = src[idx + 3];
    }
  }
  for (let y = 0; y < height; y += 1) {
    for (const x of [0, width - 1]) {
      const idx = (y * width + x) * 4;
      dst[idx] = src[idx]; dst[idx + 1] = src[idx + 1];
      dst[idx + 2] = src[idx + 2]; dst[idx + 3] = src[idx + 3];
    }
  }

  outCtx.putImageData(result, 0, 0);
  return out;
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

function hasHighQualityCandidate(candidates: Map<string, OcrCandidate>): boolean {
  for (const candidate of candidates.values()) {
    if (scoreCandidate(candidate) >= 0.78) {
      return true;
    }
  }
  return false;
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
