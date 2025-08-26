import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class LineTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

    onPointerDown(e: PointerEvent, editor: Editor): void {
      const ctx = editor.ctx;
      this.startX = e.offsetX;
      this.startY = e.offsetY;
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
    let x = e.offsetX;
    let y = e.offsetY;
    if (e.shiftKey) {
      const dx = x - this.startX;
      const dy = y - this.startY;
      const angle = Math.atan2(dy, dx);
      const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const length = Math.sqrt(dx * dx + dy * dy);
      x = this.startX + length * Math.cos(snapped);
      y = this.startY + length * Math.sin(snapped);
    }
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
    let x = e.offsetX;
    let y = e.offsetY;
    if (e.shiftKey) {
      const dx = x - this.startX;
      const dy = y - this.startY;
      const angle = Math.atan2(dy, dx);
      const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const length = Math.sqrt(dx * dx + dy * dy);
      x = this.startX + length * Math.cos(snapped);
      y = this.startY + length * Math.sin(snapped);
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    this.imageData = null;
  }
}
