import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Base class for drawing tools. It exposes a helper that applies the
 * editor's current stroke and fill settings to a rendering context.
 */
export abstract class DrawingTool implements Tool {

  protected applyStroke(
    ctx: CanvasRenderingContext2D,
    editor: Editor,
  ): void {
    ctx.lineWidth = editor.lineWidthValue;
    ctx.strokeStyle = editor.strokeStyle;
    ctx.fillStyle = editor.fillStyle;
  }

  abstract onPointerDown(e: PointerEvent, editor: Editor): void;
  abstract onPointerMove(e: PointerEvent, editor: Editor): void;
  abstract onPointerUp(e: PointerEvent, editor: Editor): void;
}

