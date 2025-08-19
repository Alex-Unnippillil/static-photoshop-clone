import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool that fills a contiguous region of pixels with the current fill color.
 * Uses a simple stack-based flood fill on the canvas' pixel data.
 */
export class BucketFillTool implements Tool {
  onPointerDown(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const image = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    const { width, height } = image;
    const dpr = window.devicePixelRatio || 1;
    const x = Math.max(0, Math.min(width - 1, Math.floor(e.offsetX * dpr)));
    const y = Math.max(0, Math.min(height - 1, Math.floor(e.offsetY * dpr)));
    const targetColor = this.getPixel(image, x, y);
    const fillColor = this.hexToRgb(editor.fillStyle);

    // if target already the fill color, nothing to do
    if (this.colorsMatch(targetColor, fillColor)) return;

    const stack: Array<[number, number]> = [[x, y]];
    while (stack.length) {
      const [px, py] = stack.pop()!;
      const current = this.getPixel(image, px, py);
      if (!this.colorsMatch(current, targetColor)) continue;
      this.setPixel(image, px, py, fillColor);
      if (px > 0) stack.push([px - 1, py]);
      if (px < width - 1) stack.push([px + 1, py]);
      if (py > 0) stack.push([px, py - 1]);
      if (py < height - 1) stack.push([px, py + 1]);
    }
    ctx.putImageData(image, 0, 0);
  }

  onPointerMove(): void {}

  onPointerUp(): void {}
=======
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onPointerUp(_e: PointerEvent, _editor: Editor): void {
      // intentionally unused
    }
=======
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }
=======
=======

  private getPixel(
    image: ImageData,
    x: number,
    y: number,
  ): [number, number, number, number] {
=======



    private getPixel(image: ImageData, x: number, y: number): [number, number, number, number] {
    const { width, data } = image;
    const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }

  private setPixel(
    image: ImageData,
    x: number,
    y: number,
    color: [number, number, number],
  ): void {
    const { width, data } = image;
    const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = 255;
  }

  private colorsMatch(
    a: [number, number, number, number],
    b: [number, number, number] | [number, number, number, number],
  ): boolean {
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
