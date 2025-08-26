import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class RectangleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    this.applyStroke(editor.ctx, editor);

    let width = e.offsetX - this.startX;
    let height = e.offsetY - this.startY;
    if (e.shiftKey) {
      const size = Math.min(Math.abs(width), Math.abs(height));
      width = Math.sign(width) * size;
      height = Math.sign(height) * size;
    }
    ctx.strokeRect(this.startX, this.startY, width, height);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, width, height);
    }
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    if (this.imageData) {
      ctx.putImageData(this.imageData, 0, 0);
    }

    this.applyStroke(editor.ctx, editor);
    let width = e.offsetX - this.startX;
    let height = e.offsetY - this.startY;
    if (e.shiftKey) {
      const size = Math.min(Math.abs(width), Math.abs(height));
      width = Math.sign(width) * size;
      height = Math.sign(height) * size;
    }
    ctx.strokeRect(this.startX, this.startY, width, height);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, width, height);
    }
    this.imageData = null;
  }
}
