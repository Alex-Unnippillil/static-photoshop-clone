import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class EraserTool extends DrawingTool {
  private minX: number | null = null;
  private minY: number | null = null;
  private maxX: number | null = null;
  private maxY: number | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "destination-out";
    this.applyStroke(ctx, editor);
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    ctx.clearRect(
      e.offsetX - editor.lineWidthValue / 2,
      e.offsetY - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
    this.minX = e.offsetX;
    this.maxX = e.offsetX;
    this.minY = e.offsetY;
    this.maxY = e.offsetY;
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.clearRect(
      e.offsetX - editor.lineWidthValue / 2,
      e.offsetY - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
    this.updateBounds(e.offsetX, e.offsetY);
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    this.updateBounds(e.offsetX, e.offsetY);
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
    this.commitBounds(editor);
  }

  private updateBounds(x: number, y: number) {
    if (this.minX === null || this.maxX === null || this.minY === null || this.maxY === null) {
      this.minX = x;
      this.maxX = x;
      this.minY = y;
      this.maxY = y;
      return;
    }
    this.minX = Math.min(this.minX, x);
    this.maxX = Math.max(this.maxX, x);
    this.minY = Math.min(this.minY, y);
    this.maxY = Math.max(this.maxY, y);
  }

  private commitBounds(editor: Editor) {
    if (
      this.minX === null ||
      this.maxX === null ||
      this.minY === null ||
      this.maxY === null
    ) {
      return;
    }
    const padding = Math.ceil(editor.lineWidthValue / 2) + 2;
    const minX = Math.min(this.minX, this.maxX);
    const maxX = Math.max(this.minX, this.maxX);
    const minY = Math.min(this.minY, this.maxY);
    const maxY = Math.max(this.minY, this.maxY);
    editor.recordDiff({
      x: minX - padding,
      y: minY - padding,
      width: Math.max(1, maxX - minX + padding * 2),
      height: Math.max(1, maxY - minY + padding * 2),
    });
    this.minX = this.minY = this.maxX = this.maxY = null;
  }
}
