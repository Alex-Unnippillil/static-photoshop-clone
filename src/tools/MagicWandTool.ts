import { Editor, type SelectionMask } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Magic wand selection tool. Creates a binary mask for pixels connected to the
 * sampled pixel whose color difference is within the configured tolerance.
 */
export class MagicWandTool implements Tool {
  cursor = "crosshair";

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const image = editor.ctx.getImageData(
      0,
      0,
      editor.canvas.width,
      editor.canvas.height,
    );

    const mask = this.createMask(e, editor, image);
    editor.setSelectionMask(mask);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // selections are created on pointer down only
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // nothing to clean up
  }

  private createMask(
    e: PointerEvent,
    editor: Editor,
    image: ImageData,
  ): SelectionMask | null {
    const { width, height, data } = image;
    if (width === 0 || height === 0) return null;

    const dpr = window.devicePixelRatio || 1;
    const startX = Math.max(
      0,
      Math.min(width - 1, Math.floor(e.offsetX * dpr)),
    );
    const startY = Math.max(
      0,
      Math.min(height - 1, Math.floor(e.offsetY * dpr)),
    );
    const startIndex = startY * width + startX;
    const offset = startIndex * 4;

    const sr = data[offset];
    const sg = data[offset + 1];
    const sb = data[offset + 2];
    const sa = data[offset + 3];

    const tolerance = editor.selectionTolerance;
    const connectivity = editor.selectionConnectivity;

    const pixelCount = width * height;
    const queue = new Uint32Array(pixelCount);
    const visited = new Uint8Array(pixelCount);
    const mask = new Uint8Array(pixelCount);

    let head = 0;
    let tail = 0;
    queue[tail++] = startIndex;
    visited[startIndex] = 1;

    const neighbors =
      connectivity === 8
        ? (
            [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
              [-1, -1],
              [1, -1],
              [-1, 1],
              [1, 1],
            ] as const
          )
        : ([
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ] as const);

    while (head < tail) {
      const index = queue[head++];
      const iOffset = index * 4;
      const r = data[iOffset];
      const g = data[iOffset + 1];
      const b = data[iOffset + 2];
      const a = data[iOffset + 3];

      if (!this.withinTolerance(r, g, b, a, sr, sg, sb, sa, tolerance)) {
        continue;
      }

      mask[index] = 255;

      const x = index % width;
      const y = (index / width) | 0;
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nIndex = ny * width + nx;
        if (visited[nIndex]) continue;
        visited[nIndex] = 1;
        queue[tail++] = nIndex;
      }
    }

    return {
      data: mask,
      width,
      height,
    };
  }

  private withinTolerance(
    r: number,
    g: number,
    b: number,
    a: number,
    sr: number,
    sg: number,
    sb: number,
    sa: number,
    tolerance: number,
  ): boolean {
    return (
      Math.abs(r - sr) <= tolerance &&
      Math.abs(g - sg) <= tolerance &&
      Math.abs(b - sb) <= tolerance &&
      Math.abs(a - sa) <= tolerance
    );
  }
}
