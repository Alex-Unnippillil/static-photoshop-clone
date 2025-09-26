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

    const { width, height } = this.getDimensions(e);
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
    const { width, height } = this.getDimensions(e);
    ctx.strokeRect(this.startX, this.startY, width, height);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, width, height);
    }
    this.recordDiff(editor, width, height);
    this.imageData = null;
  }

  private getDimensions(e: PointerEvent): { width: number; height: number } {
    let width = e.offsetX - this.startX;
    let height = e.offsetY - this.startY;
    if (e.shiftKey) {
      const size = Math.min(Math.abs(width), Math.abs(height));
      width = size * Math.sign(width);
      height = size * Math.sign(height);
    }
    return { width, height };
  }

  private recordDiff(editor: Editor, width: number, height: number) {
    const padding = Math.ceil(editor.lineWidthValue / 2) + 2;
    const endX = this.startX + width;
    const endY = this.startY + height;
    const minX = Math.min(this.startX, endX);
    const maxX = Math.max(this.startX, endX);
    const minY = Math.min(this.startY, endY);
    const maxY = Math.max(this.startY, endY);
    editor.recordDiff({
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1, maxX - minX + padding * 2),
      height: Math.max(1, maxY - minY + padding * 2),
    });
  }
}
