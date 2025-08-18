import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool that samples the canvas color at the clicked position and updates
 * the editor's color picker to the sampled value.
 */
export class EyedropperTool implements Tool {
  cursor = "crosshair";

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const { data } = editor.ctx.getImageData(e.offsetX, e.offsetY, 1, 1);
    const [r, g, b] = data;
    const toHex = (v: number) => v.toString(16).padStart(2, "0");
    editor.colorPicker.value = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1) return;
    this.onPointerDown(e, editor);
  }

  // No action needed on pointer up
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    void _e;
    void _editor;
  }
}

