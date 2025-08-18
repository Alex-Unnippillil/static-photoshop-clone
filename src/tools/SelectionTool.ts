import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool allowing users to draw a rectangular selection and drag it around.
 */
export class SelectionTool implements Tool {
  private startX = 0;
  private startY = 0;
  private selecting = false;
  private dragging = false;
  private preview: ImageData | null = null;

  cursor = "default";

  onPointerDown(e: PointerEvent, editor: Editor) {
    if (editor.hasSelection && editor.isPointInSelection(e.offsetX, e.offsetY)) {
      editor.beginDragSelection(e.offsetX, e.offsetY);
      this.dragging = true;
      return;
    }
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    this.preview = editor.ctx.getImageData(
      0,
      0,
      editor.canvas.width,
      editor.canvas.height,
    );
    this.selecting = true;
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (this.selecting && this.preview) {
      if (e.buttons !== 1) return;
      editor.ctx.putImageData(this.preview, 0, 0);
      editor.ctx.setLineDash([4, 2]);
      editor.ctx.strokeStyle = "black";
      editor.ctx.strokeRect(
        this.startX,
        this.startY,
        e.offsetX - this.startX,
        e.offsetY - this.startY,
      );
      editor.ctx.setLineDash([]);
    } else if (this.dragging) {
      editor.dragSelection(e.offsetX, e.offsetY);
    }
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    if (this.selecting && this.preview) {
      editor.ctx.putImageData(this.preview, 0, 0);
      editor.copySelection(
        this.startX,
        this.startY,
        e.offsetX - this.startX,
        e.offsetY - this.startY,
      );
      editor.clearSelection();
      this.selecting = false;
      this.preview = null;
    } else if (this.dragging) {
      editor.dragSelection(e.offsetX, e.offsetY);
      editor.endDragSelection();
      this.dragging = false;
    }
  }
}

