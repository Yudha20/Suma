type WorkerKind = 'fast' | 'digits';

type RecognizePayload = {
  data?: {
    text?: string;
    confidence?: number;
  };
};

type WorkerLike = {
  setParameters: (params: Record<string, string>) => Promise<void>;
  recognize: (image: unknown) => Promise<RecognizePayload>;
  terminate: () => Promise<void>;
};

export type OCRResult = {
  rawText: string;
  digits: string;
  confidence?: number;
};

let fastWorkerPromise: Promise<WorkerLike> | null = null;
let digitsWorkerPromise: Promise<WorkerLike> | null = null;

function assertBrowser(): void {
  if (typeof window === 'undefined') {
    throw new Error('OCR can only run in the browser (client-side).');
  }
}

export function normalizeDigits(text: string): string {
  return (text || '').replace(/[^\d]/g, '');
}

async function makeWorker(lang: 'eng' | 'digits'): Promise<WorkerLike> {
  assertBrowser();
  const module = await import('tesseract.js');
  const worker = (await module.createWorker(lang, 1, {
    langPath: '/tessdata',
    gzip: true
  })) as unknown as WorkerLike;

  await worker.setParameters({
    tessedit_char_whitelist: '0123456789',
    preserve_interword_spaces: '1',
    tessedit_pageseg_mode: '7'
  });

  return worker;
}

async function getWorker(kind: WorkerKind): Promise<WorkerLike> {
  if (kind === 'fast') {
    if (!fastWorkerPromise) {
      fastWorkerPromise = makeWorker('eng');
    }
    return fastWorkerPromise;
  }

  if (!digitsWorkerPromise) {
    digitsWorkerPromise = makeWorker('digits');
  }
  return digitsWorkerPromise;
}

export async function recognizeDigits(
  image: unknown,
  opts?: {
    mode?: WorkerKind;
    minLen?: number;
    maxLen?: number;
    timeoutMs?: number;
  }
): Promise<OCRResult> {
  const mode = opts?.mode ?? 'fast';
  const minLen = opts?.minLen ?? 2;
  const maxLen = opts?.maxLen ?? 8;
  const timeoutMs = opts?.timeoutMs ?? 3500;

  const worker = await getWorker(mode);
  const job = worker.recognize(image);
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => {
      reject(new Error(`OCR timeout after ${timeoutMs}ms (${mode})`));
    }, timeoutMs);
  });

  const result = (await Promise.race([job, timeout])) as RecognizePayload;
  const rawText = result.data?.text ?? '';
  const normalized = normalizeDigits(rawText);
  const digits = normalized.length >= minLen ? normalized.slice(0, maxLen) : '';

  return {
    rawText,
    digits,
    confidence: result.data?.confidence
  };
}

export async function terminateOCR(): Promise<void> {
  if (fastWorkerPromise) {
    const worker = await fastWorkerPromise;
    await worker.terminate();
    fastWorkerPromise = null;
  }
  if (digitsWorkerPromise) {
    const worker = await digitsWorkerPromise;
    await worker.terminate();
    digitsWorkerPromise = null;
  }
}
