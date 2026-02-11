import { clampBrightnessTweak } from '@/lib/photo/brightness';

export function binarizeForOcr(imageData: ImageData, brightnessTweak: number): ImageData {
  const tweak = clampBrightnessTweak(brightnessTweak);

  const threshold = clampThreshold(otsuThreshold(imageData) + tweak);

  const next = new ImageData(imageData.width, imageData.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    // Luma approximation.
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const v = luma >= threshold ? 255 : 0;

    next.data[i] = v;
    next.data[i + 1] = v;
    next.data[i + 2] = v;
    next.data[i + 3] = a;
  }

  return next;
}

function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) {
    return 160;
  }
  return Math.max(40, Math.min(230, Math.round(value)));
}

// Otsu's method computes a global threshold from the grayscale histogram.
function otsuThreshold(imageData: ImageData): number {
  const hist = new Array<number>(256).fill(0);
  let total = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const a = imageData.data[i + 3];
    if (a < 32) {
      continue;
    }
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const v = Math.max(0, Math.min(255, Math.round(luma)));
    hist[v] += 1;
    total += 1;
  }

  if (total === 0) {
    return 160;
  }

  let sum = 0;
  for (let i = 0; i < 256; i += 1) {
    sum += i * hist[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let varMax = -1;
  let threshold = 160;

  for (let t = 0; t < 256; t += 1) {
    wB += hist[t];
    if (wB === 0) {
      continue;
    }
    wF = total - wB;
    if (wF === 0) {
      break;
    }

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > varMax) {
      varMax = between;
      threshold = t;
    }
  }

  return threshold;
}
