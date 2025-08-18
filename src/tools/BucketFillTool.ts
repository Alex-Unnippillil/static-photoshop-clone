import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool that fills a contiguous region of pixels with the current fill color.
 * Uses a simple stack-based flood fill on the canvas' pixel data.
 */
export class BucketFillTool implements Tool {
  onPointerDown(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const { width, height } = editor.canvas;
    const image = ctx.getImageData(0, 0, width, height);
    const { x, y } = editor.getTransformedPoint(e);
    const targetColor = this.getPixel(image, x, y);
    const fillColor = this.hexToRgb(editor.fillStyle);

    // if target already the fill color, nothing to do
    if (this.colorsMatch(targetColor, fillColor)) return;

    const stack: Array<[number, number]> = [[x | 0, y | 0]];
    while (stack.length) {
      const [x, y] = stack.pop()!;
      const current = this.getPixel(image, x, y);
      if (!this.colorsMatch(current, targetColor)) continue;
      this.setPixel(image, x, y, fillColor);
      if (x > 0) stack.push([x - 1, y]);
      if (x < width - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < height - 1) stack.push([x, y + 1]);
    }
    ctx.putImageData(image, 0, 0);
  }

  onPointerMove(): void {}
  onPointerUp(): void {}

  private getPixel(image: ImageData, x: number, y: number): [number, number, number, number] {
    const { width, data } = image;
    const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }

  private setPixel(image: ImageData, x: number, y: number, color: [number, number, number]): void {
    const { width, data } = image;
    const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = 255;
  }

  private colorsMatch(a: [number, number, number, number], b: [number, number, number]): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
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
