import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
  readonly fill: boolean;
}

export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  editor.setTool(new PencilTool());

  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
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
      const dataURL = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "canvas.png";
      a.click();
    });
  }

  return {
    editor,
    destroy: () => editor.destroy(),
    get fill() {
      return fillMode.checked;
    },
  };
}
