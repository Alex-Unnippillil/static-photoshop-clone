import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool that samples the canvas color at the clicked position and updates
 * the editor's color picker to the sampled value.
 */
export class EyedropperTool implements Tool {
  cursor = "crosshair";

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const point = editor.getCanvasPoint(e);
    const { data } = editor.ctx.getImageData(point.pixelX, point.pixelY, 1, 1);
    const [r, g, b] = data;
    const toHex = (v: number) => v.toString(16).padStart(2, "0");
    editor.colorPicker.value = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    editor.colorPicker.dispatchEvent(new Event("input", { bubbles: true }));
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
