export function clampBrightnessTweak(tweak: number): number {
  if (!Number.isFinite(tweak)) {
    return 0;
  }
  return Math.max(-40, Math.min(40, Math.round(tweak)));
}

export function applyBrightness(imageData: ImageData, tweak: number): ImageData {
  const safeTweak = clampBrightnessTweak(tweak);
  const next = new ImageData(imageData.width, imageData.height);
  const delta = safeTweak * 2;

  for (let i = 0; i < imageData.data.length; i += 4) {
    next.data[i] = clampChannel(imageData.data[i] + delta);
    next.data[i + 1] = clampChannel(imageData.data[i + 1] + delta);
    next.data[i + 2] = clampChannel(imageData.data[i + 2] + delta);
    next.data[i + 3] = imageData.data[i + 3];
  }

  return next;
}

function clampChannel(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 255) {
    return 255;
  }
  return Math.round(value);
}
