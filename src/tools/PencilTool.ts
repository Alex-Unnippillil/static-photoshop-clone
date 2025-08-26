import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class PencilTool extends DrawingTool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    const { x, y } = editor.toCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    const { x, y } = editor.toCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    editor.ctx.closePath();
  }
}
