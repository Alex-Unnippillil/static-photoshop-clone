import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {
  private erase(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    const size = editor.lineWidthValue;
    ctx.clearRect(e.offsetX - size / 2, e.offsetY - size / 2, size, size);
  }

  onPointerDown(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "destination-out";
    this.erase(e, editor);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    this.erase(e, editor);
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    editor.ctx.globalCompositeOperation = "source-over";
  }
}
