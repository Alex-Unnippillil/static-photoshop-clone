import { Editor } from "../core/Editor";
import { DrawingTool } from "./DrawingTool";

export class RectangleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, editor: Editor) {
    void editor;
    this.startX = e.offsetX;
    this.startY = e.offsetY;
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    // No preview implementation
    void e;
    void editor;
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    this.applyStyles(editor);
    const x = e.offsetX;
    const y = e.offsetY;
    ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
  }
}
