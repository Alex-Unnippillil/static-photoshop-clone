import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";
import type { FloodFillWorkerSuccess } from "../core/Editor.js";

/**
 * Tool that fills a contiguous region of pixels with the current fill color.
 * Uses an iterative flood fill with typed-array backed queue to reduce memory churn.
 */
export class BucketFillTool implements Tool {
  private static readonly MAX_FILL_PIXELS = 1_000_000;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const image = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    const { width, height } = image;

    const pixelCount = width * height;
    if (pixelCount > BucketFillTool.MAX_FILL_PIXELS) {
      console.warn("Bucket fill aborted: area too large");
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const sx = Math.max(0, Math.min(width - 1, Math.floor(e.offsetX * dpr)));
    const sy = Math.max(0, Math.min(height - 1, Math.floor(e.offsetY * dpr)));

    const fillColor = this.hexToRgba(editor.fillStyle);

    const offscreen = this.createOffscreenCanvasCopy(image);

    const request = {
      type: "fill" as const,
      width,
      height,
      startX: sx,
      startY: sy,
      fill: fillColor,
      maxPixels: BucketFillTool.MAX_FILL_PIXELS,
      imageBuffer: image.data.buffer,
      canvas: offscreen,
    };

    const transfers: Transferable[] = [image.data.buffer];
    if (offscreen) transfers.push(offscreen);

    void editor
      .requestBucketFill(request, transfers)
      .then((result) => this.applyFillResult(result, editor))
      .catch((err) => {
        console.error("Bucket fill failed", err);
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }

  private hexToRgba(hex: string): [number, number, number, number] {
    let h = hex.replace(/^#/, "");
    if (h.length === 3) {
      h = h.split("").map((c) => c + c).join("");
    }
    const num = parseInt(h, 16);
    return [
      (num >> 16) & 255,
      (num >> 8) & 255,
      num & 255,
      255,
    ];
  }

  private createOffscreenCanvasCopy(image: ImageData): OffscreenCanvas | undefined {
    const scratch = document.createElement("canvas");
    if (typeof scratch.transferControlToOffscreen !== "function") {
      return undefined;
    }
    scratch.width = image.width;
    scratch.height = image.height;
    const scratchCtx = scratch.getContext("2d");
    if (!scratchCtx) {
      return undefined;
    }
    scratchCtx.putImageData(image, 0, 0);
    return scratch.transferControlToOffscreen();
  }

  private applyFillResult(result: FloodFillWorkerSuccess, editor: Editor) {
    if (result.aborted) {
      console.warn("Bucket fill aborted: exceeded pixel limit");
    }
    if (!result.dirtyRects.length) return;

    const ctx = editor.ctx;
    for (const rect of result.dirtyRects) {
      const imageData = this.createImageData(rect);
      ctx.putImageData(imageData, rect.x, rect.y);
    }
  }

  private createImageData(rect: FloodFillWorkerSuccess["dirtyRects"][number]): ImageData {
    const pixels = new Uint8ClampedArray(rect.buffer);
    if (typeof ImageData !== "undefined") {
      return new ImageData(pixels, rect.width, rect.height);
    }
    return { data: pixels, width: rect.width, height: rect.height } as ImageData;
  }
}
