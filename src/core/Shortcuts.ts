import { Editor } from "./Editor";
import { PencilTool } from "../tools/PencilTool";
import { RectangleTool } from "../tools/RectangleTool";

/**
 * Handles global keyboard shortcuts for the editor.
 * Maps key combinations to tool switching and undo/redo actions.
 */
export class Shortcuts {
  private readonly handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && key === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        this.editor.redo();
      } else {
        this.editor.undo();
      }
      return;
    }

    if (ctrl || e.altKey) return;

    switch (key) {
      case "p":
        this.editor.setTool(new PencilTool());
        break;
      case "r":
        this.editor.setTool(new RectangleTool());
        break;
    }
  };

  constructor(private editor: Editor) {
    window.addEventListener("keydown", this.handleKeyDown);
  }

  /**
   * Remove all listeners registered by this handler.
   */
  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}
