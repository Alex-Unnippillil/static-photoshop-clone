import { Editor } from "./Editor.js";
import { PencilTool } from "../tools/PencilTool.js";
import { RectangleTool } from "../tools/RectangleTool.js";
import { LineTool } from "../tools/LineTool.js";
import { CircleTool } from "../tools/CircleTool.js";
import { TextTool } from "../tools/TextTool.js";
import { EraserTool } from "../tools/EraserTool.js";
import { BucketFillTool } from "../tools/BucketFillTool.js";
import { EyedropperTool } from "../tools/EyedropperTool.js";


/**
 * Keyboard shortcuts handler for the editor.
 * Maps specific key presses to tool changes or editor actions.
 */
export class Shortcuts {
  private readonly handler: (e: KeyboardEvent) => void;
  private editor: Editor;
  private onZoom: (factor: number) => void;
  private onPan: (dx: number, dy: number) => void;
  private onReset: () => void;

  constructor(
    editor: Editor,
    onZoom?: (factor: number) => void,
    onPan?: (dx: number, dy: number) => void,
    onReset?: () => void,
  ) {
    this.editor = editor;
    this.onZoom = onZoom ?? ((f) => this.editor.zoomBy(f));
    this.onPan = onPan ?? ((dx, dy) => this.editor.pan(dx, dy));
    this.onReset = onReset ?? (() => this.editor.resetView());
    this.handler = (e: KeyboardEvent) => this.onKeyDown(e);
    document.addEventListener("keydown", this.handler);
  }

  /** Swap the editor that receives subsequent shortcut actions. */
  switchEditor(newEditor: Editor) {
    this.editor = newEditor;
  }

  private onKeyDown(e: KeyboardEvent) {

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "z":
        case "Z":
          if (e.shiftKey) {
            this.editor.redo();
          } else {
            this.editor.undo();
          }
          e.preventDefault();
          return;
        case "=":
        case "+":
          this.onZoom(1.1);
          e.preventDefault();
          return;
        case "-":
          this.onZoom(0.9);
          e.preventDefault();
          return;
        case "0":
          this.onReset();
          e.preventDefault();
          return;
      }
    }

    switch (e.key) {
      case "ArrowUp":
        this.onPan(0, -10);
        e.preventDefault();
        return;
      case "ArrowDown":
        this.onPan(0, 10);
        e.preventDefault();
        return;
      case "ArrowLeft":
        this.onPan(-10, 0);
        e.preventDefault();
        return;
      case "ArrowRight":
        this.onPan(10, 0);
        e.preventDefault();
        return;
    }

    switch (e.key.toLowerCase()) {
      case "p":
        e.preventDefault();
        this.editor.setTool(new PencilTool());
        break;
      case "r":
        e.preventDefault();
        this.editor.setTool(new RectangleTool());
        break;
      case "l":
        e.preventDefault();
        this.editor.setTool(new LineTool());
        break;
      case "c":
        e.preventDefault();
        this.editor.setTool(new CircleTool());
        break;
      case "e":
        e.preventDefault();
        this.editor.setTool(new EraserTool());
        break;
      case "t":
        e.preventDefault();
        this.editor.setTool(new TextTool());
        break;
      case "b":
        e.preventDefault();
        this.editor.setTool(new BucketFillTool());
        break;
      case "i":
        e.preventDefault();
        this.editor.setTool(new EyedropperTool());
        break;
    }
  }

  /** Remove keyboard listeners. */
  destroy() {
    document.removeEventListener("keydown", this.handler);
  }
}
