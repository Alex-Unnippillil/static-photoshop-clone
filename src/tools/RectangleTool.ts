import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class RectangleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    this.startX = snapped.x;
    this.startY = snapped.y;
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    if (snapped.snapped) {
      editor.showSnapGuides({ point: { x: this.startX, y: this.startY } });
    } else {
      editor.clearSnapGuides();
    }
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    this.applyStroke(editor.ctx, editor);

    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    let { x, y } = snapped;
    const guideSnap = editor.snapToGuides(
      { x: this.startX, y: this.startY },
      { x, y },
    );
    x = guideSnap.x;
    y = guideSnap.y;
    let width = x - this.startX;
    let height = y - this.startY;
    if (e.shiftKey) {
      const size = Math.min(Math.abs(width), Math.abs(height));
      width = size * Math.sign(width);
      height = size * Math.sign(height);
      x = this.startX + width;
      y = this.startY + height;
    }
    ctx.strokeRect(this.startX, this.startY, width, height);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, width, height);
    }

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

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    if (this.imageData) {
      ctx.putImageData(this.imageData, 0, 0);
    }

    this.applyStroke(editor.ctx, editor);
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    let { x, y } = snapped;
    const guideSnap = editor.snapToGuides(
      { x: this.startX, y: this.startY },
      { x, y },
    );
    x = guideSnap.x;
    y = guideSnap.y;
    let width = x - this.startX;
    let height = y - this.startY;
    if (e.shiftKey) {
      const size = Math.min(Math.abs(width), Math.abs(height));
      width = size * Math.sign(width);
      height = size * Math.sign(height);
      x = this.startX + width;
      y = this.startY + height;
    }
    ctx.strokeRect(this.startX, this.startY, width, height);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, width, height);
    }
    this.imageData = null;
    editor.clearSnapGuides();
  }
}
