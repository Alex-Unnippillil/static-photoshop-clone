import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";


  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;


  if (imageLoader) {
    const handler = () => {
      const file = imageLoader.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          editor.ctx.drawImage(
            img,
            0,
            0,
            editor.canvas.width,
            editor.canvas.height,
          );
          updateUndoRedoButtons();
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    };
    imageLoader.addEventListener("change", handler);
    listeners.push(() => imageLoader.removeEventListener("change", handler));
  }



  const handle: EditorHandle = {
    editor,
    activateLayer(index: number) {
      if (index < 0 || index >= editors.length || index === active) return;
      shortcuts.destroy();
      active = index;
      editor = editors[active];
      this.editor = editor;
      shortcuts = new Shortcuts(editor);
      updateUndoRedoButtons();
    },
    destroy() {
      shortcuts.destroy();
      editors.forEach((e) => e.destroy());
      listeners.forEach((off) => off());
    },
  };

}

