import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    const size = editor.lineWidthValue;
    const half = size / 2;
    ctx.clearRect(e.offsetX - half, e.offsetY - half, size, size);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    this.onPointerDown(e, editor);
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // no operation
  }
}
