import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {
  private erase(e: PointerEvent, editor: Editor) {
    const size = editor.lineWidthValue;
    const half = size / 2;
    editor.ctx.clearRect(e.offsetX - half, e.offsetY - half, size, size);
  }

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.erase(e, editor);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    this.erase(e, editor);
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // nothing to do
  }
}
