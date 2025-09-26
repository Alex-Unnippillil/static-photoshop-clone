import { Editor } from "../core/Editor.js";
import { floodFill, type FloodFillOptions } from "../core/floodFill.js";
import { Tool } from "./Tool.js";

/**
 * Tool that fills a contiguous region of pixels with the current fill color.
 * Uses an iterative flood fill with typed-array backed queue to reduce memory churn.
 */
export class BucketFillTool implements Tool {
  private static readonly MAX_FILL_PIXELS = 1_000_000;

  constructor(private readonly options: Partial<FloodFillOptions> = {}) {}

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
    const [fr, fg, fb] = this.hexToRgb(editor.fillStyle);

    const { filledPixels, aborted } = floodFill(
      image,
      sx,
      sy,
      [fr, fg, fb, 255],
      { ...this.options, maxPixels: BucketFillTool.MAX_FILL_PIXELS },
    );

    if (aborted) {
      console.warn("Bucket fill aborted: exceeded pixel limit");
    }

    if (filledPixels > 0) {
      ctx.putImageData(image, 0, 0);
    }
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
