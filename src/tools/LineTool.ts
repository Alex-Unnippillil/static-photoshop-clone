import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class LineTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const { x, y } = editor.getTransformedPoint(e);
    this.startX = x;
    this.startY = y;
    this.applyStroke(ctx, editor);
    this.imageData = ctx.getImageData(
      0,
      0,
      editor.canvas.width,
      editor.canvas.height,
    );
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    const { x, y } = editor.getTransformedPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    if (this.imageData) {
      ctx.putImageData(this.imageData, 0, 0);
    }
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    const { x, y } = editor.getTransformedPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    this.imageData = null;
  }
}
