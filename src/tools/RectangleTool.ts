import {
  DirtyRegionTracker,
  clipRect,
  expandRectForStroke,
} from "../core/DirtyRegionTracker.js";
import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class RectangleTool extends DrawingTool {
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
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    editor: Editor,
  ) {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const dirty = expandRectForStroke(
      { x, y, width: Math.max(width, 1), height: Math.max(height, 1) },
      editor.lineWidthValue,
      { width: editor.canvas.width, height: editor.canvas.height },
    );
    this.dirtyRegions.setRegions(dirty ? [dirty] : []);
  }

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    this.dirtyRegions.clear();
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    this.restoreDirtyRegions(ctx, editor);
    this.applyStroke(editor.ctx, editor);

    const x = e.offsetX;
    const y = e.offsetY;
    let width = x - this.startX;
    let height = y - this.startY;
    if (e.shiftKey) {
      const size = Math.min(Math.abs(width), Math.abs(height));
      width = size * Math.sign(width);
      height = size * Math.sign(height);
    }
    this.updateDirtyRegion(this.startX, this.startY, x, y, editor);
    ctx.strokeRect(this.startX, this.startY, width, height);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, width, height);
    }
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    if (this.imageData) {
      this.restoreDirtyRegions(ctx, editor);
    }

    this.applyStroke(editor.ctx, editor);
    const x = e.offsetX;
    const y = e.offsetY;
    let width = x - this.startX;
    let height = y - this.startY;
    if (e.shiftKey) {
      const size = Math.min(Math.abs(width), Math.abs(height));
      width = size * Math.sign(width);
      height = size * Math.sign(height);
    }
    ctx.strokeRect(this.startX, this.startY, width, height);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, width, height);
    }
    this.imageData = null;
    this.dirtyRegions.clear();
  }
}
