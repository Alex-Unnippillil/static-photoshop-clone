import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";

export function initEditor() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);
  editor.setTool(new PencilTool());
  const shortcuts = new Shortcuts(editor);

  return {
    editor,
    destroy() {
      shortcuts.dispose();
      editor.destroy();
    },
  };
}

