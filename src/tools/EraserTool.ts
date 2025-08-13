import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {
  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.erase(e, editor);
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1) return;
    this.erase(e, editor);
  }

  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // no-op
  }

  private erase(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const size = editor.lineWidthValue;
    ctx.clearRect(e.offsetX - size / 2, e.offsetY - size / 2, size, size);
  }
}

