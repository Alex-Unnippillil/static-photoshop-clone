import { Editor } from "./Editor";
import { PencilTool } from "../tools/PencilTool";
import { RectangleTool } from "../tools/RectangleTool";

export interface ShortcutHandle {
  destroy: () => void;
}

export function initShortcuts(
  editor: Editor,
  tools: { pencil: PencilTool; rectangle: RectangleTool }
): ShortcutHandle {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
      if (e.shiftKey) {
        editor.redo();
      } else {
        editor.undo();
      }
      e.preventDefault();
      return;
    }

    if (e.ctrlKey || e.metaKey) return;

    switch (e.key.toLowerCase()) {
      case "p":
        editor.setTool(tools.pencil);
        break;
      case "r":
        editor.setTool(tools.rectangle);
        break;
    }
  };

  window.addEventListener("keydown", handler);
  return {
    destroy() {
      window.removeEventListener("keydown", handler);
    },
  };
}
