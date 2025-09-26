import {
  DirtyRegionTracker,
  clipRect,
  expandRectForStroke,
} from "../core/DirtyRegionTracker.js";
import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class LineTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;
  private dirtyRegions = new DirtyRegionTracker();

  private restoreDirtyRegions(ctx: CanvasRenderingContext2D, editor: Editor) {
    if (!this.imageData) return;
    const bounds = {
      width: editor.canvas.width,
      height: editor.canvas.height,
    };
    for (const region of this.dirtyRegions.getRegions()) {
      const clipped = clipRect(region, bounds);
      if (!clipped) continue;
      ctx.putImageData(
        this.imageData,
        0,
        0,
        clipped.x,
        clipped.y,
        clipped.width,
        clipped.height,
      );
    }
  }

  private updateDirtyRegion(endX: number, endY: number, editor: Editor) {
    const rect = {
      x: Math.min(this.startX, endX),
      y: Math.min(this.startY, endY),
      width: Math.max(Math.abs(endX - this.startX), 1),
      height: Math.max(Math.abs(endY - this.startY), 1),
    };
    const dirty = expandRectForStroke(rect, editor.lineWidthValue, {
      width: editor.canvas.width,
      height: editor.canvas.height,
    });
    this.dirtyRegions.setRegions(dirty ? [dirty] : []);
  }

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    this.applyStroke(ctx, editor);
    this.imageData = ctx.getImageData(
      0,
      0,
      editor.canvas.width,
      editor.canvas.height,
    );
    this.dirtyRegions.clear();
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    this.restoreDirtyRegions(ctx, editor);
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    let x = e.offsetX;
    let y = e.offsetY;
    if (e.shiftKey) {
      const dx = x - this.startX;
      const dy = y - this.startY;
      const angle = Math.atan2(dy, dx);
      const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const length = Math.sqrt(dx * dx + dy * dy);
      x = this.startX + length * Math.cos(snapped);
      y = this.startY + length * Math.sin(snapped);
    }
    this.updateDirtyRegion(x, y, editor);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    if (this.imageData) {
      this.restoreDirtyRegions(ctx, editor);
    }
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    let x = e.offsetX;
    let y = e.offsetY;
    if (e.shiftKey) {
      const dx = x - this.startX;
      const dy = y - this.startY;
      const angle = Math.atan2(dy, dx);
      const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const length = Math.sqrt(dx * dx + dy * dy);
      x = this.startX + length * Math.cos(snapped);
      y = this.startY + length * Math.sin(snapped);
    }
    this.updateDirtyRegion(x, y, editor);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.closePath();
    this.imageData = null;
    this.dirtyRegions.clear();
  }
}
