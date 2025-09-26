import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class RectangleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    editor.clearPreview();
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) {
      editor.clearPreview();
      return;
    }
    const { width, height } = this.calculateDimensions(e);
    editor.withPreviewContext((ctx) => {
      this.applyStroke(ctx, editor);
      ctx.globalAlpha = 0.8;
      ctx.strokeRect(this.startX, this.startY, width, height);
      if (editor.fill) {
        ctx.globalAlpha = 0.3;
        ctx.fillRect(this.startX, this.startY, width, height);
      }
    });
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    const { width, height } = this.calculateDimensions(e);
    editor.clearPreview();
    this.applyStroke(editor.ctx, editor);
    ctx.strokeRect(this.startX, this.startY, width, height);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, width, height);
    }
  }

  private calculateDimensions(e: PointerEvent) {
    const x = e.offsetX;
    const y = e.offsetY;
    let width = x - this.startX;
    let height = y - this.startY;
    if (e.shiftKey) {
      const size = Math.min(Math.abs(width), Math.abs(height));
      width = size * Math.sign(width);
      height = size * Math.sign(height);
    }
    return { width, height };
  }
}
