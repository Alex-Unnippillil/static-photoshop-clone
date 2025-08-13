import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
}

export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);
  editor.setTool(new PencilTool());

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectangleBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const pencilHandler = () => editor.setTool(new PencilTool());
  const eraserHandler = () => editor.setTool(new EraserTool());
  const rectangleHandler = () => editor.setTool(new RectangleTool());
  const undoHandler = () => editor.undo();
  const redoHandler = () => editor.redo();
  const saveHandler = () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  };
  const imageHandler = () => {
    const file = imageLoader?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(img, 0, 0);
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  pencilBtn?.addEventListener("click", pencilHandler);
  eraserBtn?.addEventListener("click", eraserHandler);
  rectangleBtn?.addEventListener("click", rectangleHandler);
  undoBtn?.addEventListener("click", undoHandler);
  redoBtn?.addEventListener("click", redoHandler);
  saveBtn?.addEventListener("click", saveHandler);
  imageLoader?.addEventListener("change", imageHandler);

  const shortcuts = new Shortcuts(editor);

  const destroy = () => {
    pencilBtn?.removeEventListener("click", pencilHandler);
    eraserBtn?.removeEventListener("click", eraserHandler);
    rectangleBtn?.removeEventListener("click", rectangleHandler);
    undoBtn?.removeEventListener("click", undoHandler);
    redoBtn?.removeEventListener("click", redoHandler);
    saveBtn?.removeEventListener("click", saveHandler);
    imageLoader?.removeEventListener("change", imageHandler);
    shortcuts.destroy();
    editor.destroy();
  };

  return { editor, destroy };
}
