import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
}

export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  editor.setTool(new PencilTool());
  const shortcuts = new Shortcuts(editor);

  // Tool selection handlers
  const pencilHandler = () => editor.setTool(new PencilTool());
  const eraserHandler = () => editor.setTool(new EraserTool());
  const rectHandler = () => editor.setTool(new RectangleTool());
  const lineHandler = () => editor.setTool(new LineTool());
  const circleHandler = () => editor.setTool(new CircleTool());
  const textHandler = () => editor.setTool(new TextTool());
  pencilBtn?.addEventListener("click", pencilHandler);
  eraserBtn?.addEventListener("click", eraserHandler);
  rectBtn?.addEventListener("click", rectHandler);
  lineBtn?.addEventListener("click", lineHandler);
  circleBtn?.addEventListener("click", circleHandler);
  textBtn?.addEventListener("click", textHandler);

  // Undo/redo handlers
  const undoHandler = () => editor.undo();
  const redoHandler = () => editor.redo();
  undoBtn?.addEventListener("click", undoHandler);
  redoBtn?.addEventListener("click", redoHandler);

  // Image loading handler
  const imageLoaderHandler = () => {
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
  imageLoader?.addEventListener("change", imageLoaderHandler);

  // Save handler
  const saveHandler = () => {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "canvas.png";
    link.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  return {
    editor,
    destroy: () => {
      pencilBtn?.removeEventListener("click", pencilHandler);
      eraserBtn?.removeEventListener("click", eraserHandler);
      rectBtn?.removeEventListener("click", rectHandler);
      lineBtn?.removeEventListener("click", lineHandler);
      circleBtn?.removeEventListener("click", circleHandler);
      textBtn?.removeEventListener("click", textHandler);
      undoBtn?.removeEventListener("click", undoHandler);
      redoBtn?.removeEventListener("click", redoHandler);
      imageLoader?.removeEventListener("change", imageLoaderHandler);
      saveBtn?.removeEventListener("click", saveHandler);
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

