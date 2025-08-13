import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Base class for tools that draw using the canvas stroke style and width.
 * It provides a helper to apply the editor's current settings to the
 * rendering context. Concrete tools must implement the pointer handlers.
 */
export abstract class DrawingTool implements Tool {
  /**
   * Apply the editor's current stroke settings to the provided context.
   *
   * @param ctx - canvas rendering context to configure
   * @param editor - editor providing the stroke configuration
   */
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

