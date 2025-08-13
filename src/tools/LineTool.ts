import { Editor } from "../core/Editor";
import { DrawingTool } from "./DrawingTool";

export class LineTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    const ctx = editor.ctx;
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
    this.applyStroke(editor.ctx, editor);
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.closePath();
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.closePath();
    this.imageData = null;
  }
}
