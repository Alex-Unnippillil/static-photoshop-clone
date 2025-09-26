import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class CircleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    this.startX = snapped.x;
    this.startY = snapped.y;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    if (typeof ctx.getImageData === "function") {
      this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    } else {
      this.imageData = null;
    }
    if (snapped.snapped) {
      editor.showSnapGuides({ point: { x: this.startX, y: this.startY } });
    } else {
      editor.clearSnapGuides();
    }
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    this.applyStroke(ctx, editor);
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    let { x, y } = snapped;
    const guideSnap = editor.snapToGuides(
      { x: this.startX, y: this.startY },
      { x, y },
    );
    x = guideSnap.x;
    y = guideSnap.y;
    const dx = x - this.startX;
    const dy = y - this.startY;
    let radiusX = Math.abs(dx);
    let radiusY = Math.abs(dy);
    if (e.shiftKey) {
      const radius = Math.max(radiusX, radiusY);
      radiusX = radius;
      radiusY = radius;
      x = this.startX + Math.sign(dx || 1) * radius;
      y = this.startY + Math.sign(dy || 1) * radius;
    }
    ctx.beginPath();
    ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (editor.fill) {
      ctx.fill();
    }
    ctx.closePath();

    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    if (guideSnap.vertical) {
      lines.push({
        x1: this.startX,
        y1: 0,
        x2: this.startX,
        y2: editor.viewportHeight,
      });
    }
    if (guideSnap.horizontal) {
      lines.push({
        x1: 0,
        y1: this.startY,
        x2: editor.viewportWidth,
        y2: this.startY,
      });
    }
    if (snapped.snapped || guideSnap.vertical || guideSnap.horizontal) {
      editor.showSnapGuides({
        origin: { x: this.startX, y: this.startY },
        point: { x, y },
        lines,
      });
    } else {
      editor.clearSnapGuides();
    }
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    if (this.imageData) {
      ctx.putImageData(this.imageData, 0, 0);
    }
    this.applyStroke(ctx, editor);
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    let { x, y } = snapped;
    const guideSnap = editor.snapToGuides(
      { x: this.startX, y: this.startY },
      { x, y },
    );
    x = guideSnap.x;
    y = guideSnap.y;
    const dx = x - this.startX;
    const dy = y - this.startY;
    let radiusX = Math.abs(dx);
    let radiusY = Math.abs(dy);
    if (e.shiftKey) {
      const radius = Math.max(radiusX, radiusY);
      radiusX = radius;
      radiusY = radius;
      x = this.startX + Math.sign(dx || 1) * radius;
      y = this.startY + Math.sign(dy || 1) * radius;
    }
    ctx.beginPath();
    ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (editor.fill) {
      ctx.fill();
    }
    ctx.closePath();
    this.imageData = null;
    editor.clearSnapGuides();
  }
}

