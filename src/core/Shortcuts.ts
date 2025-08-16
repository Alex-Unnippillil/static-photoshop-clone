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
  private editor: Editor;

    this.handler = (e: KeyboardEvent) => this.onKeyDown(e);
    document.addEventListener("keydown", this.handler);
  }

  switchEditor(newEditor: Editor) {
    this.editor = newEditor;
  }

  private onKeyDown(e: KeyboardEvent) {

    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          this.editor.redo();
        } else {
          this.editor.undo();
        }
      }
      return;
    }

    // Tool switching via letter keys
    switch (e.key.toLowerCase()) {
      case "p":

        break;
    }
  }

  private activate(id: string) {
    const buttons = document.querySelectorAll("#toolbar .tool-button");
    buttons.forEach((b) => b.classList.remove("active"));
    const btn = document.getElementById(id);
    btn?.classList.add("active");
  }

  destroy() {
    document.removeEventListener("keydown", this.handler);
  }
}

