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
    const x = Math.max(0, Math.min(width - 1, Math.floor(e.offsetX * dpr)));
    const y = Math.max(0, Math.min(height - 1, Math.floor(e.offsetY * dpr)));
    const { data } = editor.ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = data;
    const toHex = (v: number) => v.toString(16).padStart(2, "0");
    editor.colorPicker.value = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // intentionally unused
  }
}

