import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Base class for tools that draw using the canvas stroke style and width.
 * It provides a helper to apply the editor's current settings to the
 * rendering context. Concrete tools must implement the pointer handlers.
 */
export abstract class DrawingTool implements Tool {
  /**
   * Apply the current editor stroke and fill settings to a rendering context.
   * This ensures drawing tools respect the selected line width and colors.
   */
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
