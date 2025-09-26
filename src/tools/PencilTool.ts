import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

export class PencilTool extends DrawingTool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    ctx.beginPath();
    ctx.moveTo(snapped.x, snapped.y);
    if (snapped.snapped) {
      editor.showSnapGuides({ point: { x: snapped.x, y: snapped.y } });
    } else {
      editor.clearSnapGuides();
    }
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;
    this.applyStroke(editor.ctx, editor);
    const ctx = editor.ctx;
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    ctx.lineTo(snapped.x, snapped.y);
    ctx.stroke();
    if (snapped.snapped) {
      editor.showSnapGuides({ point: { x: snapped.x, y: snapped.y } });
    } else {
      editor.clearSnapGuides();
    }
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    editor.ctx.closePath();
    editor.clearSnapGuides();
  }
}
