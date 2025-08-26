import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool that samples the canvas color at the clicked position and updates
 * the editor's color picker to the sampled value.
 */
export class EyedropperTool implements Tool {
  cursor = "crosshair";

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const { width, height } = editor.canvas;
    const dpr = window.devicePixelRatio || 1;
    const { x, y } = editor.getCanvasCoords(e);
    const px = Math.max(0, Math.min(width - 1, Math.floor(x * dpr)));
    const py = Math.max(0, Math.min(height - 1, Math.floor(y * dpr)));
    const { data } = editor.ctx.getImageData(px, py, 1, 1);
    const [r, g, b] = data;
    const toHex = (v: number) => v.toString(16).padStart(2, "0");
    editor.colorPicker.value = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1) return;
    this.onPointerDown(e, editor);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }
}
