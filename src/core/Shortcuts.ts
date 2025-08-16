import { Editor } from "./Editor";
import { PencilTool } from "../tools/PencilTool";
import { RectangleTool } from "../tools/RectangleTool";
import { LineTool } from "../tools/LineTool";
import { CircleTool } from "../tools/CircleTool";
import { TextTool } from "../tools/TextTool";
import { EraserTool } from "../tools/EraserTool";

/**
 * Keyboard shortcuts handler for the editor.
 * Maps specific key presses to tool changes or editor actions.
 */
export class Shortcuts {
  private readonly handler: (e: KeyboardEvent) => void;

  /**
   * @param getEditor Function returning the currently active editor. This allows
   *                  shortcuts to always operate on the active layer.
   */
  constructor(private readonly getEditor: () => Editor) {
    this.handler = (e: KeyboardEvent) => this.onKeyDown(e);
    document.addEventListener("keydown", this.handler);
  }

  private onKeyDown(e: KeyboardEvent) {
    const editor = this.getEditor();
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          editor.redo();
        } else {
          editor.undo();
        }
        e.preventDefault();
      }
      return;
    }

    switch (e.key.toLowerCase()) {
      case "p":
        editor.setTool(new PencilTool());
        break;
      case "r":
        editor.setTool(new RectangleTool());
        break;
      case "l":
        editor.setTool(new LineTool());
        break;
      case "c":
        editor.setTool(new CircleTool());
        break;
      case "t":
        editor.setTool(new TextTool());
        break;
      case "e":
        editor.setTool(new EraserTool());
        break;
    }
  }

  destroy() {
    document.removeEventListener("keydown", this.handler);
  }
}

