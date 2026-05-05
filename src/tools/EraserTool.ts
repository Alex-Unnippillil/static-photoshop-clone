import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class EraserTool extends DrawingTool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const point = editor.getCanvasPoint(e);
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "destination-out";
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.clearRect(
      point.x - editor.lineWidthValue / 2,
      point.y - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const point = editor.getCanvasPoint(e);
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.clearRect(
      point.x - editor.lineWidthValue / 2,
      point.y - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
  }
}
