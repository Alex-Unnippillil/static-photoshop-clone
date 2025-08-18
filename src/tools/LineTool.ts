import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class LineTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const start = editor.getCanvasPoint(e);
    this.startX = start.x;
    this.startY = start.y;
    this.applyStroke(editor.ctx, editor);
    this.imageData = editor.getSnapshot();
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    editor.putSnapshot(this.imageData);
    this.applyStroke(ctx, editor);
    const { x, y } = editor.getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    if (this.imageData) {
      editor.putSnapshot(this.imageData);
    }
    this.applyStroke(ctx, editor);
    const { x, y } = editor.getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    this.imageData = null;
  }
}

