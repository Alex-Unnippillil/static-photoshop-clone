import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export abstract class DrawingTool implements Tool {
  protected applyStroke(
    ctx: CanvasRenderingContext2D,
    editor: Editor,
  ): void {
    ctx.lineWidth = editor.lineWidthValue;
    ctx.strokeStyle = editor.strokeStyle;
  }

  abstract onPointerDown(e: PointerEvent, editor: Editor): void;
  abstract onPointerMove(e: PointerEvent, editor: Editor): void;
  abstract onPointerUp(e: PointerEvent, editor: Editor): void;
}
