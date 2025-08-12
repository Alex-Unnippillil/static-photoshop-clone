import { Editor } from "../core/Editor";
import { DrawingTool } from "./DrawingTool";

export class CircleTool extends DrawingTool {
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, _editor: Editor) {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
  }

  onPointerMove(_e: PointerEvent, _editor: Editor) {
    // No preview implementation
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    this.applyStyles(editor);
    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  }
}

