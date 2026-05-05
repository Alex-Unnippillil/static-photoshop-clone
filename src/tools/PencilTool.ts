import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class PencilTool extends DrawingTool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const point = editor.getCanvasPoint(e);
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const point = editor.getCanvasPoint(e);
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    editor.ctx.closePath();
  }
}
