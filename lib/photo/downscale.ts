const DEFAULT_MAX_DIMENSION = 512;

export type DownscaleResult = {
  canvas: HTMLCanvasElement;
  imageData: ImageData;
};

export async function downscaleImageFile(
  file: File,
  maxDimension = DEFAULT_MAX_DIMENSION
): Promise<DownscaleResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  const img = await loadImage(file);
  const { width, height } = getScaledDimensions(img.naturalWidth, img.naturalHeight, maxDimension);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('Unable to initialize canvas context.');
  }

  context.drawImage(img, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  return { canvas, imageData };
}

function getScaledDimensions(width: number, height: number, maxDimension: number): { width: number; height: number } {
  if (width <= 0 || height <= 0) {
    return { width: 256, height: 256 };
  }
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const src = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image.'));
      img.src = src;
    });
    return image;
  } finally {
    URL.revokeObjectURL(src);
  }
}
