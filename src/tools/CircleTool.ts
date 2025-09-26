import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class CircleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    editor.clearPreview();
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1) {
      editor.clearPreview();
      return;
    }
    const { radiusX, radiusY } = this.calculateRadii(e);
    editor.withPreviewContext((ctx) => {
      this.applyStroke(ctx, editor);
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (editor.fill) {
        ctx.globalAlpha = 0.3;
        ctx.fill();
      }
      ctx.closePath();
    });
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const { radiusX, radiusY } = this.calculateRadii(e);
    editor.clearPreview();
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (editor.fill) {
      ctx.fill();
    }
    ctx.closePath();
  }

  private calculateRadii(e: PointerEvent) {
    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    let radiusX = Math.abs(dx);
    let radiusY = Math.abs(dy);
    if (e.shiftKey) {
      const radius = Math.max(radiusX, radiusY);
      radiusX = radius;
      radiusY = radius;
    }
    return { radiusX, radiusY };
  }
}

