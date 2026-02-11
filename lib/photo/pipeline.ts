import { applyBrightness, clampBrightnessTweak } from '@/lib/photo/brightness';
import { binarizeForOcr } from '@/lib/photo/binarize';
import { downscaleImageFile } from '@/lib/photo/downscale';
import { deriveSeedFromPalette } from '@/lib/photo/mapping';
import { extractOcrCandidatesDetailed, pickBestOcrCandidate } from '@/lib/photo/ocr';
import { extractPalette } from '@/lib/photo/palette';
import type { ExplainBlock, PhotoSeedResult } from '@/lib/photo/types';
import { generateWeightedSeed } from '@/lib/session/engine';

export type PhotoPipelineOptions = {
  brightnessTweak: number;
  ocrTimeoutMs?: number;
  paletteTimeoutMs?: number;
};

const DEFAULT_TIMEOUTS = {
  ocr: 6000,
  palette: 1200
};

export async function processPhotoForSeed(
  file: File,
  options: PhotoPipelineOptions
): Promise<PhotoSeedResult> {
  try {
    return await runPipeline(file, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Photo scan failed.';
    const fallbackSeed = generateWeightedSeed();
    return {
      seed: fallbackSeed,
      seedSource: 'surprise',
      status: 'fallback',
      photoCandidates: [],
      paletteSwatches: [],
      explainability: [
        {
          title: 'Fallback used',
          lines: [
            message,
            'We switched to Surprise Me so training starts immediately.'
          ]
        }
      ],
      message: 'Photo scan could not complete in time. Using Surprise Me seed.'
    };
  }
}

async function runPipeline(file: File, options: PhotoPipelineOptions): Promise<PhotoSeedResult> {
  const brightnessTweak = clampBrightnessTweak(options.brightnessTweak);
  const ocrTimeoutMs = options.ocrTimeoutMs ?? DEFAULT_TIMEOUTS.ocr;
  const paletteTimeoutMs = options.paletteTimeoutMs ?? DEFAULT_TIMEOUTS.palette;

  // Use a larger working size for OCR to avoid destroying small/low-contrast digits.
  // Palette extraction still runs on a smaller copy for performance.
  const { canvas, imageData } = await downscaleImageFile(file, 1024);
  const brightenedOcr = applyBrightness(imageData, brightnessTweak);

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('Canvas context unavailable for photo processing.');
  }
  context.putImageData(brightenedOcr, 0, 0);

  const palettePromise = (async () => {
    const paletteCanvas = document.createElement('canvas');
    const scale = Math.min(1, 512 / Math.max(canvas.width, canvas.height));
    paletteCanvas.width = Math.max(1, Math.round(canvas.width * scale));
    paletteCanvas.height = Math.max(1, Math.round(canvas.height * scale));
    const paletteCtx = paletteCanvas.getContext('2d', { willReadFrequently: true });
    if (!paletteCtx) {
      return [];
    }
    paletteCtx.drawImage(canvas, 0, 0, paletteCanvas.width, paletteCanvas.height);
    const paletteImage = paletteCtx.getImageData(0, 0, paletteCanvas.width, paletteCanvas.height);
    const brightenedPalette = applyBrightness(paletteImage, brightnessTweak);
    return extractPalette(brightenedPalette, 6, paletteTimeoutMs).catch(() => []);
  })();

  // OCR runs on a binarized version to reduce 0/1 confusion on low-contrast scans.
  const ocrImage = binarizeForOcr(brightenedOcr, brightnessTweak);
  context.putImageData(ocrImage, 0, 0);
  const ocrResult = await extractOcrCandidatesDetailed(canvas, ocrTimeoutMs);
  const ocrCandidates = ocrResult.candidates;

  const bestOcr = pickBestOcrCandidate(ocrCandidates);
  // 2-digit OCR hits are frequently false-positives (e.g. "1,2" -> "12") from surrounding text.
  // Prefer palette fallback unless OCR finds a more meaningful group.
  if (bestOcr && bestOcr.digits.length >= 3) {
    const paletteSwatches = await palettePromise;
    return {
      seed: bestOcr.digits,
      seedSource: 'photo-ocr',
      status: 'done',
      photoCandidates: ocrCandidates.map((candidate) => candidate.digits),
      paletteSwatches,
      explainability: buildOcrExplainability(bestOcr.digits, ocrCandidates, ocrResult.diagnostics),
      message: `Using OCR seed ${bestOcr.digits}.`
    };
  }

  const paletteSwatches = await palettePromise;
  const mapped = deriveSeedFromPalette(paletteSwatches, brightnessTweak, 8);

  if (!/^\d{2,8}$/.test(mapped.seed)) {
    throw new Error('Palette mapping did not produce a valid seed.');
  }

  return {
    seed: mapped.seed,
    seedSource: 'photo-palette',
    status: 'done',
    photoCandidates: ocrCandidates.map((candidate) => candidate.digits),
    paletteSwatches,
    explainability: buildPaletteExplainability(mapped.legend, brightnessTweak, ocrResult.diagnostics),
    message: buildPaletteMessage(mapped.seed, ocrResult.diagnostics)
  };
}

function buildOcrExplainability(
  seed: string,
  candidates: Array<{ digits: string; source?: 'text-detector' | 'tesseract' }>,
  diagnostics: string[]
): ExplainBlock[] {
  const source = candidates.find((candidate) => candidate.digits === seed)?.source ?? 'text-detector';
  return [
    {
      title: 'How we got this number',
      lines: [
        `OCR found digits: ${seed}`,
        `OCR engine: ${source}`,
        candidates.length > 1 ? `Alternates: ${candidates.slice(1).map((item) => item.digits).join(', ')}` : 'No alternate digit groups found.',
        ...diagnostics
      ]
    }
  ];
}

function buildPaletteExplainability(
  legend: string[],
  brightnessTweak: number,
  diagnostics: string[]
): ExplainBlock[] {
  return [
    {
      title: 'How we got this number',
      lines: [
        `OCR did not produce a usable result, so we used palette mapping.`,
        `Brightness tweak: ${brightnessTweak}`,
        ...diagnostics,
        ...legend
      ]
    }
  ];
}

function buildPaletteMessage(seed: string, diagnostics: string[]): string {
  const firstFailure = diagnostics.find((line) => line.includes('found no valid digit groups.') || line.includes('error:'));
  if (firstFailure) {
    return `Using palette-derived seed ${seed}. ${firstFailure}`;
  }
  return `Using palette-derived seed ${seed}.`;
}
