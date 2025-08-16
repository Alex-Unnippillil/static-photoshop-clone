import { Editor } from "./Editor";
import { PencilTool } from "../tools/PencilTool";
import { RectangleTool } from "../tools/RectangleTool";
import { LineTool } from "../tools/LineTool";
import { CircleTool } from "../tools/CircleTool";
import { TextTool } from "../tools/TextTool";
import { EraserTool } from "../tools/EraserTool";

/**
 * Keyboard shortcut manager. Binds to `keydown` events and translates key
 * presses into editor actions such as switching tools or performing undo/redo.
 * A single instance can be shared across multiple editors by calling
 * {@link switchEditor} when the active editor changes.
 */
export class Shortcuts {
  private readonly handler: (e: KeyboardEvent) => void;
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
    this.handler = (e: KeyboardEvent) => this.onKeyDown(e);
    document.addEventListener("keydown", this.handler);
  }

  /** Swap the editor that receives subsequent shortcut actions. */
  switchEditor(newEditor: Editor) {
    this.editor = newEditor;
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          this.editor.redo();
        } else {
          this.editor.undo();
        }
        e.preventDefault();
      }
      return;
    }

    switch (e.key.toLowerCase()) {
      case "p":
        this.editor.setTool(new PencilTool());
        this.activate("pencil");
        break;

      case "r":
        this.editor.setTool(new RectangleTool());
        this.activate("rectangle");
        break;
      case "l":
        this.editor.setTool(new LineTool());
        this.activate("line");
        break;
      case "c":
        this.editor.setTool(new CircleTool());
        this.activate("circle");
        break;
      case "t":
        this.editor.setTool(new TextTool());
        this.activate("text");

        break;
    }
  }

  /** Highlight toolbar button corresponding to the tool id. */
  private activate(id: string) {
    const buttons = document.querySelectorAll("#toolbar .tool-button");
    buttons.forEach((b) => b.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
  }

  /** Remove keyboard listeners. */
  destroy() {
    document.removeEventListener("keydown", this.handler);
  }
}

