import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class RectangleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    const { x, y } = editor.getCanvasCoords(e);
    this.startX = x;
    this.startY = y;
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    this.applyStroke(editor.ctx, editor);

    const { x, y } = editor.getCanvasCoords(e);
    ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, x - this.startX, y - this.startY);
    }
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    if (this.imageData) {
      ctx.putImageData(this.imageData, 0, 0);
    }

    this.applyStroke(editor.ctx, editor);
    const { x, y } = editor.getCanvasCoords(e);
    ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, x - this.startX, y - this.startY);
    }
    this.imageData = null;
  }
}
