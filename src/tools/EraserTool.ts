import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "destination-out";
    const size = editor.lineWidthValue;
    ctx.clearRect(e.offsetX - size / 2, e.offsetY - size / 2, size, size);
    if (ctx.beginPath && ctx.moveTo) {
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    }
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const ctx = editor.ctx;
    const size = editor.lineWidthValue;
    ctx.clearRect(e.offsetX - size / 2, e.offsetY - size / 2, size, size);
    if (ctx.lineTo && ctx.stroke) {
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    }
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "source-over";
    if (ctx.closePath) {
      ctx.closePath();
    }
  }
}

}
