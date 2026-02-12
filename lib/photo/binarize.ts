import { clampBrightnessTweak } from '@/lib/photo/brightness';

export function binarizeForOcr(imageData: ImageData, brightnessTweak: number): ImageData {
  const tweak = clampBrightnessTweak(brightnessTweak);

  // Stretch contrast before thresholding so low-contrast scans get better separation.
  const stretched = contrastStretch(imageData);

  const globalThreshold = clampThreshold(otsuThreshold(stretched) + tweak);

  // Decide between global Otsu and adaptive local thresholding.
  // If the image has a very wide intensity spread (likely mixed lighting / light-on-dark),
  // use adaptive tiling; otherwise use the faster global path.
  const useAdaptive = shouldUseAdaptiveThreshold(stretched);

  const next = useAdaptive
    ? adaptiveLocalThreshold(stretched, tweak)
    : applyGlobalThreshold(stretched, globalThreshold);

  const darkRatio = estimateDarkPixelRatio(next);

  // If the image is mostly dark (light-on-dark), invert it for OCR.
  if (darkRatio >= 0.55) {
    invertBinaryInPlace(next);
    const invertedDarkRatio = estimateDarkPixelRatio(next);
    if (invertedDarkRatio <= 0.001 || invertedDarkRatio >= 0.2) {
      return next;
    }
    return erodeDarkPixels(dilateDarkPixels(next));
  }

  if (darkRatio <= 0.001 || darkRatio >= 0.2) {
    return next;
  }

  // Thin handwritten strokes can break after thresholding; lightly thicken dark pixels.
  // Follow with a single erosion pass to prevent merging adjacent strokes into blobs.
  return erodeDarkPixels(dilateDarkPixels(next));
}

function applyGlobalThreshold(imageData: ImageData, threshold: number): ImageData {
  const next = new ImageData(imageData.width, imageData.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const v = luma >= threshold ? 255 : 0;
    next.data[i] = v;
    next.data[i + 1] = v;
    next.data[i + 2] = v;
    next.data[i + 3] = a;
  }
  return next;
}

/**
 * Adaptive local threshold: split image into tiles, compute per-tile Otsu,
 * then threshold each pixel against its tile's threshold. This handles
 * uneven lighting and mixed-contrast images (neon signs, postcards, etc.).
 */
function adaptiveLocalThreshold(imageData: ImageData, tweak: number): ImageData {
  const { width, height } = imageData;
  const tileSize = Math.max(16, Math.min(64, Math.floor(Math.max(width, height) / 8)));
  const tilesX = Math.ceil(width / tileSize);
  const tilesY = Math.ceil(height / tileSize);

  // Compute per-tile thresholds.
  const tileThresholds: number[] = new Array(tilesX * tilesY);
  for (let ty = 0; ty < tilesY; ty += 1) {
    for (let tx = 0; tx < tilesX; tx += 1) {
      const x0 = tx * tileSize;
      const y0 = ty * tileSize;
      const x1 = Math.min(width, x0 + tileSize);
      const y1 = Math.min(height, y0 + tileSize);
      tileThresholds[ty * tilesX + tx] = clampThreshold(
        otsuThresholdRegion(imageData, x0, y0, x1, y1) + tweak
      );
    }
  }

  const next = new ImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    const ty = Math.min(tilesY - 1, Math.floor(y / tileSize));
    for (let x = 0; x < width; x += 1) {
      const tx = Math.min(tilesX - 1, Math.floor(x / tileSize));
      const threshold = tileThresholds[ty * tilesX + tx];
      const i = (y * width + x) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const v = luma >= threshold ? 255 : 0;
      next.data[i] = v;
      next.data[i + 1] = v;
      next.data[i + 2] = v;
      next.data[i + 3] = a;
    }
  }
  return next;
}

function otsuThresholdRegion(imageData: ImageData, x0: number, y0: number, x1: number, y1: number): number {
  const hist = new Array<number>(256).fill(0);
  let total = 0;
  const { width } = imageData;

  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * width + x) * 4;
      if (imageData.data[i + 3] < 32) continue;
      const luma = 0.2126 * imageData.data[i] + 0.7152 * imageData.data[i + 1] + 0.0722 * imageData.data[i + 2];
      hist[Math.max(0, Math.min(255, Math.round(luma)))] += 1;
      total += 1;
    }
  }

  if (total === 0) return 160;

  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * hist[i];

  let sumB = 0, wB = 0, wF = 0, varMax = -1, threshold = 160;
  for (let t = 0; t < 256; t += 1) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > varMax) { varMax = between; threshold = t; }
  }
  return threshold;
}

/** Detect images where adaptive thresholding would help (high variance across regions). */
function shouldUseAdaptiveThreshold(imageData: ImageData): boolean {
  const { width, height } = imageData;
  if (width < 64 || height < 64) return false;

  // Sample 4 quadrants and compare their mean luminance.
  const means: number[] = [];
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);
  const regions = [
    [0, 0, halfW, halfH],
    [halfW, 0, width, halfH],
    [0, halfH, halfW, height],
    [halfW, halfH, width, height]
  ];

  for (const [x0, y0, x1, y1] of regions) {
    let sum = 0, count = 0;
    // Sample every 4th pixel for speed.
    for (let y = y0; y < y1; y += 4) {
      for (let x = x0; x < x1; x += 4) {
        const i = (y * width + x) * 4;
        if (imageData.data[i + 3] < 32) continue;
        sum += 0.2126 * imageData.data[i] + 0.7152 * imageData.data[i + 1] + 0.0722 * imageData.data[i + 2];
        count += 1;
      }
    }
    means.push(count > 0 ? sum / count : 128);
  }

  const minMean = Math.min(...means);
  const maxMean = Math.max(...means);
  // If quadrant means differ by more than 60 luma units, use adaptive.
  return (maxMean - minMean) > 60;
}

/** Stretch histogram to [0, 255] to improve contrast for washed-out scans. */
function contrastStretch(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  let lo = 255, hi = 0;

  // Find 1st and 99th percentile to avoid outlier influence.
  const hist = new Array<number>(256).fill(0);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;
    const luma = Math.max(0, Math.min(255, Math.round(
      0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    )));
    hist[luma] += 1;
    total += 1;
  }

  if (total === 0) return imageData;

  const p1 = Math.floor(total * 0.01);
  const p99 = Math.floor(total * 0.99);
  let cumulative = 0;
  for (let i = 0; i < 256; i += 1) {
    cumulative += hist[i];
    if (cumulative >= p1 && lo === 255) lo = i;
    if (cumulative >= p99) { hi = i; break; }
  }

  const range = hi - lo;
  if (range < 30) return imageData; // Already high contrast or nearly uniform.

  const out = new ImageData(new Uint8ClampedArray(data), width, height);
  for (let i = 0; i < out.data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      out.data[i + c] = Math.max(0, Math.min(255, Math.round(((data[i + c] - lo) / range) * 255)));
    }
  }
  return out;
}

function invertBinaryInPlace(imageData: ImageData): void {
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255 - imageData.data[i];
    imageData.data[i + 1] = 255 - imageData.data[i + 1];
    imageData.data[i + 2] = 255 - imageData.data[i + 2];
  }
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

function estimateDarkPixelRatio(imageData: ImageData): number {
  let opaque = 0;
  let dark = 0;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i + 3];
    if (alpha < 32) {
      continue;
    }
    opaque += 1;
    if (imageData.data[i] < 64) {
      dark += 1;
    }
  }

  if (opaque === 0) {
    return 0;
  }
  return dark / opaque;
}

function dilateDarkPixels(imageData: ImageData): ImageData {
  const { width, height } = imageData;
  const source = imageData.data;
  const out = new ImageData(new Uint8ClampedArray(source), width, height);
  const target = out.data;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      if (source[idx] > 64) {
        continue;
      }

      for (let dy = -1; dy <= 1; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) {
          continue;
        }

        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) {
            continue;
          }
          const nidx = (ny * width + nx) * 4;
          target[nidx] = 0;
          target[nidx + 1] = 0;
          target[nidx + 2] = 0;
          target[nidx + 3] = Math.max(target[nidx + 3], source[idx + 3]);
        }
      }
    }
  }

  return out;
}

/**
 * Light morphological erosion: a dark pixel survives only if at least
 * 3 of its 4 cardinal neighbours are also dark. This prevents dilation
 * from merging adjacent thin strokes into blobs (e.g. "8" → "0").
 */
function erodeDarkPixels(imageData: ImageData): ImageData {
  const { width, height } = imageData;
  const source = imageData.data;
  const out = new ImageData(new Uint8ClampedArray(source), width, height);
  const target = out.data;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const idx = (y * width + x) * 4;
      if (source[idx] > 64) continue; // Already light, skip.

      let darkNeighbors = 0;
      if (source[idx - width * 4] < 64) darkNeighbors += 1; // up
      if (source[idx + width * 4] < 64) darkNeighbors += 1; // down
      if (source[idx - 4] < 64) darkNeighbors += 1;          // left
      if (source[idx + 4] < 64) darkNeighbors += 1;          // right

      if (darkNeighbors < 3) {
        target[idx] = 255;
        target[idx + 1] = 255;
        target[idx + 2] = 255;
      }
    }
  }

  return out;
}
