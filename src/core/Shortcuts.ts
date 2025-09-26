import { Editor } from "./Editor.js";
import type { Tool } from "../tools/Tool.js";

type ToolLoader = (id: string) => Promise<new () => Tool>;

const keyToToolId: Record<string, string> = {
  p: "pencil",
  r: "rectangle",
  l: "line",
  c: "circle",
  e: "eraser",
  t: "text",
  b: "bucket",
  i: "eyedropper",
};


/**
 * Keyboard shortcuts handler for the editor.
 * Maps specific key presses to tool changes or editor actions.
 */
export class Shortcuts {
  private readonly handler: (e: KeyboardEvent) => void;
  private editor: Editor;
  private readonly loadTool: ToolLoader;

  constructor(editor: Editor, loadTool: ToolLoader) {
    this.editor = editor;
    this.loadTool = loadTool;
    this.handler = (e: KeyboardEvent) => {
      void this.onKeyDown(e);
    };
    document.addEventListener("keydown", this.handler);
  }

  /** Swap the editor that receives subsequent shortcut actions. */
  switchEditor(newEditor: Editor) {
    this.editor = newEditor;
  }

  private async onKeyDown(e: KeyboardEvent) {
    
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "z") {
        if (e.shiftKey) {
          this.editor.redo();
        } else {
          this.editor.undo();
        }
        e.preventDefault();
      } else if (key === "y" && e.ctrlKey && !e.metaKey) {
        this.editor.redo();
        e.preventDefault();
      }
      return;
    }

    const key = e.key.toLowerCase();
    const toolId = keyToToolId[key];
    if (toolId) {
      e.preventDefault();
      try {
        const ToolCtor = await this.loadTool(toolId);
        this.editor.setTool(new ToolCtor());
      } catch {
        /* ignore failed dynamic import */
      }
    }
  }

  /** Remove keyboard listeners. */
  destroy() {
    document.removeEventListener("keydown", this.handler);
  }
}
