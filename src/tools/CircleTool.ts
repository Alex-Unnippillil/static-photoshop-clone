import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class CircleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const start = editor.getCanvasPoint(e);
    this.startX = start.x;
    this.startY = start.y;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    this.imageData = editor.getSnapshot();
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    editor.putSnapshot(this.imageData);
    this.applyStroke(ctx, editor);

    const { x, y } = editor.getCanvasPoint(e);
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
      editor.putSnapshot(this.imageData);
    }
    this.applyStroke(ctx, editor);
    const { x, y } = editor.getCanvasPoint(e);
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

