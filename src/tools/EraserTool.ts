import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class EraserTool extends DrawingTool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.globalCompositeOperation = "destination-out";
    this.applyStroke(ctx, editor);
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    ctx.beginPath();
    ctx.moveTo(snapped.x, snapped.y);
    ctx.clearRect(
      snapped.x - editor.lineWidthValue / 2,
      snapped.y - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
    if (snapped.snapped) {
      editor.showSnapGuides({ point: { x: snapped.x, y: snapped.y } });
    } else {
      editor.clearSnapGuides();
    }
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    ctx.lineTo(snapped.x, snapped.y);
    ctx.stroke();
    ctx.clearRect(
      snapped.x - editor.lineWidthValue / 2,
      snapped.y - editor.lineWidthValue / 2,
      editor.lineWidthValue,
      editor.lineWidthValue,
    );
    if (snapped.snapped) {
      editor.showSnapGuides({ point: { x: snapped.x, y: snapped.y } });
    } else {
      editor.clearSnapGuides();
    }
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
    editor.clearSnapGuides();
  }
}
