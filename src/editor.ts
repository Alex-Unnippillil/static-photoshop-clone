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
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  editor.setTool(new PencilTool());
  const shortcuts = new Shortcuts(editor);

  const onSave = () => {
    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "canvas.png";
    anchor.click();
  };
  saveBtn?.addEventListener("click", onSave);

  const onImageLoad = () => {
    const file = imageLoader?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  imageLoader?.addEventListener("change", onImageLoad);

  return {
    editor,
    destroy() {
      shortcuts.destroy();
      editor.destroy();
      saveBtn?.removeEventListener("click", onSave);
      imageLoader?.removeEventListener("change", onImageLoad);
    },
  };
}

