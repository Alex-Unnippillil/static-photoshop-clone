import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class EraserTool extends DrawingTool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "destination-out";
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    const { x, y } = editor.getCanvasPoint(e);
    const size = editor.lineWidthValue / editor.scale;
    ctx.moveTo(x, y);
    ctx.clearRect(x - size / 2, y - size / 2, size, size);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    const { x, y } = editor.getCanvasPoint(e);
    const size = editor.lineWidthValue / editor.scale;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.clearRect(x - size / 2, y - size / 2, size, size);
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
  }
}
