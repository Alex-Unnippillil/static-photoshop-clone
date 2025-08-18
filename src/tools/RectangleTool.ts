import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class RectangleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    const start = editor.getCanvasPoint(e);
    this.startX = start.x;
    this.startY = start.y;
    this.applyStroke(editor.ctx, editor);
    this.imageData = editor.getSnapshot();
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    editor.putSnapshot(this.imageData);
    this.applyStroke(editor.ctx, editor);

    const { x, y } = editor.getCanvasPoint(e);
    ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, x - this.startX, y - this.startY);
    }
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    if (this.imageData) {
      editor.putSnapshot(this.imageData);
    }
    this.applyStroke(editor.ctx, editor);
    const { x, y } = editor.getCanvasPoint(e);
    ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    if (editor.fill) {
      ctx.fillRect(this.startX, this.startY, x - this.startX, y - this.startY);
    }
    this.imageData = null;
  }
}
