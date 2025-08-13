import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Base class for tools that draw using the canvas stroke style and width.
 * It provides a helper to apply the editor's current settings to the
 * rendering context. Concrete tools must implement the pointer handlers.
 */
export abstract class DrawingTool implements Tool {

  /**
   * Apply the current editor stroke settings to the provided context.
   *
   * This synchronizes the drawing context with the user's selected
   * line width and stroke color prior to performing any drawing
   * operations. Tools that extend this class should call this before
   * issuing stroke commands on the context.
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

