type PaletteRequest = {
  data: number[];
  swatchCount: number;
};

type PaletteResponse = Array<{ r: number; g: number; b: number; prominence: number }>;

type Bucket = {
  count: number;
  r: number;
  g: number;
  b: number;
};

self.onmessage = (event: MessageEvent<PaletteRequest>) => {
  const { data, swatchCount } = event.data;
  const buckets = new Map<number, Bucket>();
  let totalCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 32) {
      continue;
    }

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
    totalCount += 1;
  }

  const sorted = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, swatchCount));

  const response: PaletteResponse = sorted.map((bucket) => ({
    r: Math.round(bucket.r / bucket.count),
    g: Math.round(bucket.g / bucket.count),
    b: Math.round(bucket.b / bucket.count),
    prominence: totalCount > 0 ? bucket.count / totalCount : 0
  }));

  self.postMessage(response);
};

export {};
