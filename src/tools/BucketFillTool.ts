import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

export type BucketFillConnectivity = 4 | 8;

export interface BucketFillOptions {
  tolerance: number;
  connectivity: BucketFillConnectivity;
}

/**
 * Tool that fills a contiguous region of pixels with the current fill color.
 * Uses an iterative flood fill with typed-array backed queue to reduce memory churn.
 */
export class BucketFillTool implements Tool {
  private static readonly MAX_FILL_PIXELS = 1_000_000;
  private static defaults: BucketFillOptions = {
    tolerance: 0,
    connectivity: 4,
  };

  private readonly override?: BucketFillOptions;

  constructor(options?: Partial<BucketFillOptions>) {
    if (options) {
      this.override = BucketFillTool.normalizeOptions(
        options,
        BucketFillTool.defaults,
      );
    }
  }

  static getDefaults(): BucketFillOptions {
    return { ...BucketFillTool.defaults };
  }

  static setDefaults(options: Partial<BucketFillOptions>): BucketFillOptions {
    BucketFillTool.defaults = BucketFillTool.normalizeOptions(
      options,
      BucketFillTool.defaults,
    );
    return BucketFillTool.getDefaults();
  }

  private static normalizeOptions(
    options: Partial<BucketFillOptions>,
    base: BucketFillOptions,
  ): BucketFillOptions {
    const tolerance =
      options.tolerance !== undefined
        ? BucketFillTool.clampTolerance(options.tolerance)
        : base.tolerance;
    const connectivity =
      options.connectivity !== undefined
        ? options.connectivity === 8
          ? 8
          : 4
        : base.connectivity;
    return { tolerance, connectivity };
  }

  private static clampTolerance(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  private get options(): BucketFillOptions {
    return this.override ?? BucketFillTool.defaults;
  }

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const image = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    const { width, height, data } = image;

    const pixelCount = width * height;
    if (pixelCount > BucketFillTool.MAX_FILL_PIXELS) {
      console.warn("Bucket fill aborted: area too large");
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const sx = Math.max(0, Math.min(width - 1, Math.floor(e.offsetX * dpr)));
    const sy = Math.max(0, Math.min(height - 1, Math.floor(e.offsetY * dpr)));
    const start = sy * width + sx;
    const targetOffset = start * 4;
    const tr = data[targetOffset];
    const tg = data[targetOffset + 1];
    const tb = data[targetOffset + 2];

    const [fr, fg, fb] = this.hexToRgb(editor.fillStyle);

    // if target already the fill color, nothing to do
    if (tr === fr && tg === fg && tb === fb) return;

    const queue = new Uint32Array(pixelCount);
    const visited = new Uint8Array(pixelCount);
    let head = 0;
    let tail = 0;
    let processed = 0;

    const { tolerance, connectivity } = this.options;
    const useEightConnectivity = connectivity === 8;

    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
      const idx = queue[head++];
      const offset = idx * 4;
      if (
        Math.abs(data[offset] - tr) > tolerance ||
        Math.abs(data[offset + 1] - tg) > tolerance ||
        Math.abs(data[offset + 2] - tb) > tolerance
      ) {
        continue;
      }

      data[offset] = fr;
      data[offset + 1] = fg;
      data[offset + 2] = fb;
      data[offset + 3] = 255;
      processed++;
      if (processed > BucketFillTool.MAX_FILL_PIXELS) {
        console.warn("Bucket fill aborted: exceeded pixel limit");
        break;
      }

      const x = idx % width;
      const y = (idx / width) | 0;

      const enqueue = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) return;
        const n = ny * width + nx;
        if (!visited[n]) {
          queue[tail++] = n;
          visited[n] = 1;
        }
      };

      enqueue(x - 1, y);
      enqueue(x + 1, y);
      enqueue(x, y - 1);
      enqueue(x, y + 1);

      if (useEightConnectivity) {
        enqueue(x - 1, y - 1);
        enqueue(x + 1, y - 1);
        enqueue(x - 1, y + 1);
        enqueue(x + 1, y + 1);
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }

  private hexToRgb(hex: string): [number, number, number] {
    let h = hex.replace(/^#/, "");
    if (h.length === 3) {
      h = h.split("").map((c) => c + c).join("");
    }
    const num = parseInt(h, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
}
