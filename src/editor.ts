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
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectangleBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);
  editor.setTool(new PencilTool());

  const loadImage = (file: File) => {
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

  const handleImageChange = () => {
    const file = imageLoader?.files?.[0];
    if (file) loadImage(file);
  };
  imageLoader?.addEventListener("change", handleImageChange);

  const handleDragOver = (e: DragEvent) => e.preventDefault();
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) loadImage(file);
  };
  canvas.addEventListener("dragover", handleDragOver);
  canvas.addEventListener("drop", handleDrop);

  const handleSave = () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  };
  saveBtn?.addEventListener("click", handleSave);

  const pencilHandler = () => editor.setTool(new PencilTool());
  const eraserHandler = () => editor.setTool(new EraserTool());
  const rectangleHandler = () => editor.setTool(new RectangleTool());
  const lineHandler = () => editor.setTool(new LineTool());
  const circleHandler = () => editor.setTool(new CircleTool());
  const textHandler = () => editor.setTool(new TextTool());
  const undoHandler = () => editor.undo();
  const redoHandler = () => editor.redo();

  pencilBtn?.addEventListener("click", pencilHandler);
  eraserBtn?.addEventListener("click", eraserHandler);
  rectangleBtn?.addEventListener("click", rectangleHandler);
  lineBtn?.addEventListener("click", lineHandler);
  circleBtn?.addEventListener("click", circleHandler);
  textBtn?.addEventListener("click", textHandler);
  undoBtn?.addEventListener("click", undoHandler);
  redoBtn?.addEventListener("click", redoHandler);

  const destroy = () => {
    editor.destroy();
    shortcuts.destroy();
    saveBtn?.removeEventListener("click", handleSave);
    imageLoader?.removeEventListener("change", handleImageChange);
    canvas.removeEventListener("dragover", handleDragOver);
    canvas.removeEventListener("drop", handleDrop);
    pencilBtn?.removeEventListener("click", pencilHandler);
    eraserBtn?.removeEventListener("click", eraserHandler);
    rectangleBtn?.removeEventListener("click", rectangleHandler);
    lineBtn?.removeEventListener("click", lineHandler);
    circleBtn?.removeEventListener("click", circleHandler);
    textBtn?.removeEventListener("click", textHandler);
    undoBtn?.removeEventListener("click", undoHandler);
    redoBtn?.removeEventListener("click", redoHandler);
  };

  return { editor, destroy };
}

