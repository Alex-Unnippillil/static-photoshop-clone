import { Editor } from "../core/Editor";
import { DrawingTool } from "./DrawingTool";

export class CircleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = editor.ctx as any;
    this.imageData = ctx.getImageData
      ? ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height)
      : null;
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = editor.ctx as any;
    ctx.putImageData?.(this.imageData, 0, 0);
    this.applyStroke(editor.ctx, editor);
    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
    ctx.stroke();
    if (editor.fill) {
      ctx.fill();
    }
    ctx.closePath();
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;

    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
    ctx.stroke();
    if (editor.fill) {
      ctx.fill();
    }
    ctx.closePath();
    this.imageData = null;
  }
}
