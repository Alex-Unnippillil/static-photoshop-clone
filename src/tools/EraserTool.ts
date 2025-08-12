import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {
  private erase(x: number, y: number, editor: Editor) {
    const size = editor.lineWidthValue;
    const half = size / 2;
    editor.ctx.clearRect(x - half, y - half, size, size);
  }

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.erase(e.offsetX, e.offsetY, editor);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    this.erase(e.offsetX, e.offsetY, editor);
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // no operation
  }
}
