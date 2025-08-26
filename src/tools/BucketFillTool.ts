import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool that fills a contiguous region of pixels with the current fill color.
 * Uses an iterative flood fill with typed-array backed queue to reduce memory churn.
 */
export class BucketFillTool implements Tool {
  private static readonly MAX_FILL_PIXELS = 1_000_000;

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

    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
      const idx = queue[head++];
      const offset = idx * 4;
      if (data[offset] !== tr || data[offset + 1] !== tg || data[offset + 2] !== tb) {
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

      if (x > 0) {
        const n = idx - 1;
        if (!visited[n]) {
          queue[tail++] = n;
          visited[n] = 1;
        }
      }
      if (x < width - 1) {
        const n = idx + 1;
        if (!visited[n]) {
          queue[tail++] = n;
          visited[n] = 1;
        }
      }
      if (y > 0) {
        const n = idx - width;
        if (!visited[n]) {
          queue[tail++] = n;
          visited[n] = 1;
        }
      }
      if (y < height - 1) {
        const n = idx + width;
        if (!visited[n]) {
          queue[tail++] = n;
          visited[n] = 1;
        }
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
