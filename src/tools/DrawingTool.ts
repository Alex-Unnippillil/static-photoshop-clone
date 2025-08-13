import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Base class for tools that draw using the canvas stroke style and width.
 * It provides a helper to apply the editor's current settings to the
 * rendering context. Concrete tools must implement the pointer handlers.
 */
export abstract class DrawingTool implements Tool {
  protected applyStroke(editor: Editor): void {
    const ctx = editor.ctx;
    ctx.lineWidth = editor.lineWidthValue;
    ctx.strokeStyle = editor.strokeStyle;
  }

  abstract onPointerDown(e: PointerEvent, editor: Editor): void;
  abstract onPointerMove(e: PointerEvent, editor: Editor): void;
  abstract onPointerUp(e: PointerEvent, editor: Editor): void;
}

