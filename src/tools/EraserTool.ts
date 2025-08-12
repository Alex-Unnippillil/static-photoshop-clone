import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {
  private erase(e: PointerEvent, editor: Editor) {
    const size = editor.lineWidthValue;
    editor.ctx.clearRect(e.offsetX - size / 2, e.offsetY - size / 2, size, size);
  }

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.erase(e, editor);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    this.erase(e, editor);
  }

  // No special action on pointer up
  onPointerUp(_e: PointerEvent, _editor: Editor) {}
}
