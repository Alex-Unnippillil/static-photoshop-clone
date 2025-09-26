import {
  DirtyRegionTracker,
  clipRect,
  expandRectForStroke,
} from "../core/DirtyRegionTracker.js";
import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class CircleTool extends DrawingTool {
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

  private updateDirtyRegion(
    radiusX: number,
    radiusY: number,
    editor: Editor,
  ): void {
    const rect = {
      x: this.startX - radiusX,
      y: this.startY - radiusY,
      width: radiusX * 2,
      height: radiusY * 2,
    };
    const dirty = expandRectForStroke(rect, editor.lineWidthValue, {
      width: editor.canvas.width,
      height: editor.canvas.height,
    });
    this.dirtyRegions.setRegions(dirty ? [dirty] : []);
  }

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    if (typeof ctx.getImageData === "function") {
      this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    } else {
      this.imageData = null;
    }
    this.dirtyRegions.clear();
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    this.restoreDirtyRegions(ctx, editor);
    this.applyStroke(ctx, editor);
    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    let radiusX = Math.abs(dx);
    let radiusY = Math.abs(dy);
    if (e.shiftKey) {
      const radius = Math.max(radiusX, radiusY);
      radiusX = radius;
      radiusY = radius;
    }
    this.updateDirtyRegion(radiusX, radiusY, editor);
    ctx.beginPath();
    ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (editor.fill) {
      ctx.fill();
    }
    ctx.closePath();
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    if (this.imageData) {
      this.restoreDirtyRegions(ctx, editor);
    }
    this.applyStroke(ctx, editor);
    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    let radiusX = Math.abs(dx);
    let radiusY = Math.abs(dy);
    if (e.shiftKey) {
      const radius = Math.max(radiusX, radiusY);
      radiusX = radius;
      radiusY = radius;
    }
    ctx.beginPath();
    ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (editor.fill) {
      ctx.fill();
    }
    ctx.closePath();
    this.imageData = null;
    this.dirtyRegions.clear();
  }
}

