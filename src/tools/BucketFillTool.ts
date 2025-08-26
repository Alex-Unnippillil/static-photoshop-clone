import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool that fills a contiguous region of pixels with the current fill color.
 * Uses an iterative queue-based flood fill on the canvas' pixel data.
 */
export class BucketFillTool implements Tool {
  onPointerDown(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const image = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    const { width, height, data } = image;

    const totalPixels = width * height;
    const MAX_FILL_PIXELS = 1_000_000; // safety guard to avoid freezing
    if (totalPixels > MAX_FILL_PIXELS) {
      // avoid allocating enormous buffers on huge canvases
      console.warn("BucketFillTool: canvas too large to fill");
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const x = Math.max(0, Math.min(width - 1, Math.floor(e.offsetX * dpr)));
    const y = Math.max(0, Math.min(height - 1, Math.floor(e.offsetY * dpr)));

    const data32 = new Uint32Array(data.buffer);
    const startIdx = y * width + x;
    const targetColor = data32[startIdx];

    const rgb = this.hexToRgb(editor.fillStyle);
    const fillColor = (255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0];

    // if target already the fill color, nothing to do
    if (targetColor === fillColor) return;

    const queue = new Uint32Array(totalPixels);
    let qh = 0;
    let qt = 0;
    queue[qt++] = startIdx;
    data32[startIdx] = fillColor;
    let processed = 0;

    while (qh < qt) {
      const idx = queue[qh++];
      const px = idx % width;
      const py = (idx / width) | 0;

      if (px > 0) {
        const n = idx - 1;
        if (data32[n] === targetColor) {
          data32[n] = fillColor;
          queue[qt++] = n;
        }
      }
      if (px < width - 1) {
        const n = idx + 1;
        if (data32[n] === targetColor) {
          data32[n] = fillColor;
          queue[qt++] = n;
        }
      }
      if (py > 0) {
        const n = idx - width;
        if (data32[n] === targetColor) {
          data32[n] = fillColor;
          queue[qt++] = n;
        }
      }
      if (py < height - 1) {
        const n = idx + width;
        if (data32[n] === targetColor) {
          data32[n] = fillColor;
          queue[qt++] = n;
        }
      }

      processed++;
      if (processed > MAX_FILL_PIXELS || qt >= queue.length) {
        console.warn("BucketFillTool: fill aborted due to size");
        break;
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
