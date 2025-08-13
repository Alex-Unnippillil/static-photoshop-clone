import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = editor.lineWidthValue;
    ctx.beginPath?.();
    ctx.moveTo?.(e.offsetX, e.offsetY);
    ctx.clearRect(
      e.offsetX - editor.lineWidthValue / 2,
      e.offsetY - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const ctx = editor.ctx;
    ctx.lineWidth = editor.lineWidthValue;
    ctx.lineTo?.(e.offsetX, e.offsetY);
    ctx.stroke?.();
    ctx.clearRect(
      e.offsetX - editor.lineWidthValue / 2,
      e.offsetY - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
  }

  
  }
}
