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

  constructor(private readonly editor: Editor) {
    this.handler = (e: KeyboardEvent) => this.onKeyDown(e);
    document.addEventListener("keydown", this.handler);
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
      case "e":
        this.editor.setTool(new EraserTool());
        this.activate("eraser");
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

