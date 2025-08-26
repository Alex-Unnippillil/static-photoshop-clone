import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class CircleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const { x, y } = editor.getCanvasCoords(e);
    this.startX = x;
    this.startY = y;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    if (typeof ctx.getImageData === "function") {
      this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    } else {
      this.imageData = null;
    }
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    this.applyStroke(ctx, editor);

    const { x, y } = editor.getCanvasCoords(e);
    const dx = x - this.startX;
    const dy = y - this.startY;
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
    const ctx = editor.ctx;
    if (this.imageData) {
      ctx.putImageData(this.imageData, 0, 0);
    }
    this.applyStroke(ctx, editor);
    const { x, y } = editor.getCanvasCoords(e);
    const dx = x - this.startX;
    const dy = y - this.startY;
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

