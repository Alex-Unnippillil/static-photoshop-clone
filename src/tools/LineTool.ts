import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class LineTool implements Tool {
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
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    ctx.closePath();
  }
}

