export type Connectivity = 4 | 8;

export interface FloodFillOptions {
  /** Maximum per-channel distance (inclusive) allowed between the seed color and a pixel. */
  tolerance?: number;
  /** Determines whether diagonal neighbours are considered connected. */
  connectivity?: Connectivity;
  /** Hard cap of pixels that may be processed before aborting. */
  maxPixels?: number;
}

export interface FloodFillResult {
  filledPixels: number;
  aborted: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<FloodFillOptions, "maxPixels">> & { maxPixels: number } = {
  tolerance: 0,
  connectivity: 4,
  maxPixels: Number.POSITIVE_INFINITY,
};

export function floodFill(
  image: ImageData,
  startX: number,
  startY: number,
  fillColor: readonly [number, number, number, number?],
  options: FloodFillOptions = {},
): FloodFillResult {
  const { width, height, data } = image;
  if (width === 0 || height === 0) {
    return { filledPixels: 0, aborted: false };
  }

  const { tolerance, connectivity, maxPixels } = { ...DEFAULT_OPTIONS, ...options };
  const clampedTolerance = Math.max(0, Math.min(255, Math.floor(tolerance)));
  const maxProcessable = Number.isFinite(maxPixels) && maxPixels >= 0 ? Math.floor(maxPixels) : DEFAULT_OPTIONS.maxPixels;

  const sx = Math.max(0, Math.min(width - 1, Math.floor(startX)));
  const sy = Math.max(0, Math.min(height - 1, Math.floor(startY)));
  const startIndex = sy * width + sx;
  const startOffset = startIndex * 4;

  const targetR = data[startOffset];
  const targetG = data[startOffset + 1];
  const targetB = data[startOffset + 2];
  const targetA = data[startOffset + 3];

  const fillR = clamp255(fillColor[0]);
  const fillG = clamp255(fillColor[1]);
  const fillB = clamp255(fillColor[2]);
  const fillA = clamp255(fillColor[3] ?? 255);

  if (
    Math.abs(fillR - targetR) <= clampedTolerance &&
    Math.abs(fillG - targetG) <= clampedTolerance &&
    Math.abs(fillB - targetB) <= clampedTolerance &&
    Math.abs(fillA - targetA) <= clampedTolerance
  ) {
    return { filledPixels: 0, aborted: false };
  }

  const maxPixelsCount = width * height;
  const queue = new Uint32Array(maxPixelsCount);
  const visited = new Uint8Array(maxPixelsCount);
  let head = 0;
  let tail = 0;
  let processed = 0;
  let aborted = false;

  queue[tail++] = startIndex;
  visited[startIndex] = 1;

  const offsets = connectivity === 8 ? getEightNeighbourOffsets(width) : getFourNeighbourOffsets(width);

  while (head < tail) {
    const idx = queue[head++];
    const offset = idx * 4;

    if (!withinTolerance(data, offset, targetR, targetG, targetB, targetA, clampedTolerance)) {
      continue;
    }

    data[offset] = fillR;
    data[offset + 1] = fillG;
    data[offset + 2] = fillB;
    data[offset + 3] = fillA;
    processed++;
    if (processed > maxPixelsCount || (maxProcessable !== DEFAULT_OPTIONS.maxPixels && processed > maxProcessable)) {
      aborted = true;
      break;
    }

    for (let i = 0; i < offsets.length; i++) {
      const neighbour = idx + offsets[i];
      if (neighbour < 0 || neighbour >= maxPixelsCount) continue;
      if (connectivity === 4) {
        if (!areFourConnected(idx, neighbour, width)) continue;
      } else if (!areEightConnected(idx, neighbour, width)) {
        continue;
      }
      if (!visited[neighbour]) {
        queue[tail++] = neighbour;
        visited[neighbour] = 1;
      }
    }
  }

  return { filledPixels: processed, aborted };
}

function withinTolerance(
  data: Uint8ClampedArray,
  offset: number,
  r: number,
  g: number,
  b: number,
  a: number,
  tolerance: number,
) {
  return (
    Math.abs(data[offset] - r) <= tolerance &&
    Math.abs(data[offset + 1] - g) <= tolerance &&
    Math.abs(data[offset + 2] - b) <= tolerance &&
    Math.abs(data[offset + 3] - a) <= tolerance
  );
}

function clamp255(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function getFourNeighbourOffsets(width: number): Int32Array {
  return new Int32Array([-1, 1, -width, width]);
}

function getEightNeighbourOffsets(width: number): Int32Array {
  return new Int32Array([-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1]);
}

function areFourConnected(idx: number, neighbour: number, width: number): boolean {
  const x = idx % width;
  const nx = neighbour % width;
  const diffX = Math.abs(nx - x);
  const diffY = Math.abs(((neighbour / width) | 0) - ((idx / width) | 0));
  return diffX + diffY === 1;
}

function areEightConnected(idx: number, neighbour: number, width: number): boolean {
  const x = idx % width;
  const y = (idx / width) | 0;
  const nx = neighbour % width;
  const ny = (neighbour / width) | 0;
  return Math.max(Math.abs(nx - x), Math.abs(ny - y)) === 1;
}
