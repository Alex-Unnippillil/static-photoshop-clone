import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class EraserTool extends DrawingTool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "destination-out";
    this.applyStroke(ctx, editor);
    const { x, y } = editor.toCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.clearRect(
      x - editor.lineWidthValue / 2,
      y - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    const { x, y } = editor.toCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.clearRect(
      x - editor.lineWidthValue / 2,
      y - editor.lineWidthValue / 2,
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
