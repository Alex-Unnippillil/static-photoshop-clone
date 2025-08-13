import { Editor } from "./Editor";
import { PencilTool } from "../tools/PencilTool";
import { RectangleTool } from "../tools/RectangleTool";
import { LineTool } from "../tools/LineTool";
import { CircleTool } from "../tools/CircleTool";
import { TextTool } from "../tools/TextTool";
import { EraserTool } from "../tools/EraserTool";
import { Tool } from "../tools/Tool";

export class Shortcuts {
  private readonly handler = (e: KeyboardEvent) => this.onKeyDown(e);
  private readonly toolMap: Record<string, new () => Tool> = {
    p: PencilTool,
    r: RectangleTool,
    l: LineTool,
    c: CircleTool,
    t: TextTool,
    e: EraserTool,
  };

  constructor(private editor: Editor) {
    window.addEventListener("keydown", this.handler);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === "z") {
        if (event.shiftKey) {
          this.editor.redo();
        } else {
          this.editor.undo();
        }
        event.preventDefault();
      }
      return;
    }

    const ToolCtor = this.toolMap[event.key.toLowerCase()];
    if (ToolCtor) {
      this.editor.setTool(new ToolCtor());
      event.preventDefault();
    }
  }

  dispose(): void {
    window.removeEventListener("keydown", this.handler);
  }
}
