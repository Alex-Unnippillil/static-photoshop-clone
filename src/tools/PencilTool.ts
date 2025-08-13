import { Editor } from "../core/Editor";
import { DrawingTool } from "./DrawingTool";

export class PencilTool extends DrawingTool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    this.applyStroke(editor);
    const ctx = editor.ctx;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const ctx = editor.ctx;

    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    editor.ctx.closePath();
  }
}
