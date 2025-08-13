import type { Editor } from "../core/Editor";
import type { Tool } from "./Tool";

/**
 * Base class for drawing tools that rely on the editor's stroke settings.
 * It exposes a helper that applies the current line width and color to a
 * given rendering context before drawing.
 */
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

