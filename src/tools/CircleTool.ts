import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class CircleTool implements Tool {
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
    ctx.lineWidth = editor.lineWidthValue;
    ctx.strokeStyle = editor.strokeStyle;
    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  }
}

