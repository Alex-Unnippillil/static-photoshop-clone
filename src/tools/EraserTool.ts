import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class EraserTool extends DrawingTool {
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
    editor.showBrushPreview(e.offsetX, e.offsetY, {
      color: "#000",
      lineDash: [4, 4],
    });
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) {
      editor.showBrushPreview(e.offsetX, e.offsetY, {
        color: "#000",
        lineDash: [4, 4],
      });
      return;
    }
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
    editor.showBrushPreview(e.offsetX, e.offsetY, {
      color: "#000",
      lineDash: [4, 4],
    });
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
    editor.showBrushPreview(e.offsetX, e.offsetY, {
      color: "#000",
      lineDash: [4, 4],
    });
  }
}
