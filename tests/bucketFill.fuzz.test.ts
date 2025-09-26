import fc from "fast-check";
import { floodFill } from "../src/core/floodFill.js";

describe("floodFill fuzzing", () => {
  const gridArb = fc
    .tuple(fc.integer({ min: 1, max: 8 }), fc.integer({ min: 1, max: 8 }))
    .chain(([width, height]) =>
      fc.record({
        width: fc.constant(width),
        height: fc.constant(height),
        pixels: fc.array(fc.integer({ min: 0, max: 255 }), {
          minLength: width * height * 4,
          maxLength: width * height * 4,
        }),
        startX: fc.integer({ min: 0, max: width - 1 }),
        startY: fc.integer({ min: 0, max: height - 1 }),
        fill: fc.tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
        ),
        tolerance: fc.integer({ min: 0, max: 128 }),
        connectivity: fc.constantFrom<4 | 8>(4, 8),
      }),
    );

  it("matches the reference implementation across random grids", () => {
    fc.assert(
      fc.property(gridArb, ({
        width,
        height,
        pixels,
        startX,
        startY,
        fill,
        tolerance,
        connectivity,
      }) => {
        const base = new Uint8ClampedArray(pixels);
        const actualImage = {
          data: new Uint8ClampedArray(base),
          width,
          height,
        } as ImageData;
        const expectedData = naiveFloodFill(
          new Uint8ClampedArray(base),
          width,
          height,
          startX,
          startY,
          fill,
          tolerance,
          connectivity,
        );

        const result = floodFill(actualImage, startX, startY, fill, {
          tolerance,
          connectivity,
        });

        expect(Array.from(actualImage.data)).toEqual(Array.from(expectedData.data));
        expect(result.filledPixels).toBe(expectedData.filledPixels);
        expect(result.aborted).toBe(false);
      }),
      { numRuns: 50 },
    );
  });
});

type FillTuple = readonly [number, number, number, number];

function naiveFloodFill(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  fill: FillTuple,
  tolerance: number,
  connectivity: 4 | 8,
) {
  const sx = clamp(startX, 0, width - 1);
  const sy = clamp(startY, 0, height - 1);
  const startIndex = sy * width + sx;
  const startOffset = startIndex * 4;

  const target = [data[startOffset], data[startOffset + 1], data[startOffset + 2], data[startOffset + 3]] as const;
  if (withinTolerance(target, fill, tolerance)) {
    return { data, filledPixels: 0 };
  }

  const queue = [startIndex];
  const visited = new Uint8Array(width * height);
  visited[startIndex] = 1;

  const deltas = connectivity === 8 ? getEightConnectivity() : getFourConnectivity();
  let processed = 0;

  while (queue.length > 0) {
    const idx = queue.shift()!;
    const offset = idx * 4;

    const current = [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]] as const;
    if (!withinTolerance(current, target, tolerance)) {
      continue;
    }

    data[offset] = fill[0];
    data[offset + 1] = fill[1];
    data[offset + 2] = fill[2];
    data[offset + 3] = fill[3];
    processed++;

    const x = idx % width;
    const y = (idx / width) | 0;

    for (const [dx, dy] of deltas) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (visited[nIdx]) continue;
      visited[nIdx] = 1;
      queue.push(nIdx);
    }
  }

  return { data, filledPixels: processed };
}

function withinTolerance(color: FillTuple, target: FillTuple, tolerance: number) {
  return (
    Math.abs(color[0] - target[0]) <= tolerance &&
    Math.abs(color[1] - target[1]) <= tolerance &&
    Math.abs(color[2] - target[2]) <= tolerance &&
    Math.abs(color[3] - target[3]) <= tolerance
  );
}

function getFourConnectivity() {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
}

function getEightConnectivity() {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ] as const;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
