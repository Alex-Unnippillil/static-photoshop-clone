import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export abstract class DrawingTool implements Tool {
  protected applyStroke(editor: Editor): void {
    const ctx = editor.ctx;
    ctx.lineWidth = editor.lineWidthValue;
    ctx.strokeStyle = editor.strokeStyle;
    ctx.fillStyle = editor.fillStyle;
  }

  abstract onPointerDown(e: PointerEvent, editor: Editor): void;
  abstract onPointerMove(e: PointerEvent, editor: Editor): void;
  abstract onPointerUp(e: PointerEvent, editor: Editor): void;
}

