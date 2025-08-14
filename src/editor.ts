import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
}

export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as
    | HTMLInputElement
    | null;

  const editor = new Editor(
    canvas,
    colorPicker,
    lineWidth,
    fillMode ?? undefined,
  );
  editor.setTool(new PencilTool());
  const shortcuts = new Shortcuts(editor);

  const imageLoader = document.getElementById("imageLoader") as
    | HTMLInputElement
    | null;
  if (imageLoader) {
    imageLoader.addEventListener("change", () => {
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
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  const saveButton = document.getElementById("save") as HTMLButtonElement | null;
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = editor.canvas.toDataURL("image/png");
      link.download = "canvas.png";
      link.click();
    });
  }

  return {
    editor,
    destroy() {
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

