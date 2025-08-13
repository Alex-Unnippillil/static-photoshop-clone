import { Editor } from "../core/Editor";
import { DrawingTool } from "./DrawingTool";

export class RectangleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    const ctx = editor.ctx;
    this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    this.applyStroke(ctx, editor);
    const x = e.offsetX;
    const y = e.offsetY;
    ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    if (editor.fill) {
      ctx.fillStyle = editor.fillStyle;
      ctx.fillRect(this.startX, this.startY, x - this.startX, y - this.startY);
    }
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    if (this.imageData) {
      ctx.putImageData(this.imageData, 0, 0);
    }

    const x = e.offsetX;
    const y = e.offsetY;
    this.applyStroke(ctx, editor);
    ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    if (editor.fill) {
      ctx.fillStyle = editor.fillStyle;
      ctx.fillRect(this.startX, this.startY, x - this.startX, y - this.startY);
    }
    this.imageData = null;
  }
}
