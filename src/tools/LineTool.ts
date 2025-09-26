import { Editor, type AngleSnapResult } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class LineTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    this.startX = snapped.x;
    this.startY = snapped.y;
    this.applyStroke(ctx, editor);
    this.imageData = ctx.getImageData(
      0,
      0,
      editor.canvas.width,
      editor.canvas.height,
    );
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
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    let { x, y } = snapped;
    const guideSnap = editor.snapToGuides(
      { x: this.startX, y: this.startY },
      { x, y },
    );
    x = guideSnap.x;
    y = guideSnap.y;
    let angleSnap: AngleSnapResult | null = null;
    if (editor.shouldSnapAngles(e)) {
      angleSnap = editor.snapAngle(
        { x: this.startX, y: this.startY },
        { x, y },
        true,
      );
      if (angleSnap.snapped) {
        x = angleSnap.x;
        y = angleSnap.y;
      }
    }
    ctx.lineTo(x, y);
    ctx.stroke();
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
    if (angleSnap?.snapped) {
      lines.push({
        x1: this.startX,
        y1: this.startY,
        x2: angleSnap.x,
        y2: angleSnap.y,
      });
    }
    if (
      snapped.snapped ||
      guideSnap.vertical ||
      guideSnap.horizontal ||
      angleSnap?.snapped
    ) {
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
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    let { x, y } = snapped;
    const guideSnap = editor.snapToGuides(
      { x: this.startX, y: this.startY },
      { x, y },
    );
    x = guideSnap.x;
    y = guideSnap.y;
    if (editor.shouldSnapAngles(e)) {
      const angleSnap = editor.snapAngle(
        { x: this.startX, y: this.startY },
        { x, y },
        true,
      );
      if (angleSnap.snapped) {
        x = angleSnap.x;
        y = angleSnap.y;
      }
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    this.imageData = null;
    editor.clearSnapGuides();
  }
}
