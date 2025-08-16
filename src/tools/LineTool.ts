import { Editor } from "../core/Editor";
import { DrawingTool } from "./DrawingTool";

export class LineTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.startX = e.offsetX;
    this.startY = e.offsetY;

  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;

    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.closePath();
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx as any;
    if (this.imageData) {
      ctx.putImageData?.(this.imageData, 0, 0);
    }
    this.applyStroke(editor.ctx, editor);

    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.closePath();
    this.imageData = null;
  }
}
