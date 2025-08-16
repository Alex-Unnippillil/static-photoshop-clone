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

  /**
   * Create a shortcuts manager bound to an editor instance.
   * The manager listens to keydown events on the document and
   * delegates them to {@link onKeyDown}.
   */
  constructor(initial: Editor) {
    this.editor = initial;
    this.handler = (e: KeyboardEvent) => this.onKeyDown(e);
    document.addEventListener("keydown", this.handler);
  }

  switchEditor(newEditor: Editor) {
    this.editor = newEditor;
  }

  private onKeyDown(e: KeyboardEvent) {
    const editor = this.editor;

    // Undo / redo shortcuts (Ctrl/Cmd + Z / Ctrl/Cmd + Shift + Z)
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          editor.redo();
        } else {
          editor.undo();
        }
      }
      return;
    }

    // Tool switching via letter keys
    switch (e.key.toLowerCase()) {
      case "p":
        editor.setTool(new PencilTool());
        this.activate("pencil");
        break;
      case "e":
        editor.setTool(new EraserTool());
        this.activate("eraser");
        break;
      case "r":
        editor.setTool(new RectangleTool());
        this.activate("rectangle");
        break;
      case "l":
        editor.setTool(new LineTool());
        this.activate("line");
        break;
      case "c":
        editor.setTool(new CircleTool());
        this.activate("circle");
        break;
      case "t":
        editor.setTool(new TextTool());
        this.activate("text");
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

