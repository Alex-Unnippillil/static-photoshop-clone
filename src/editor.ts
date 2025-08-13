import { Editor } from "./core/Editor";
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

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const eraser = new EraserTool();
  const rectangle = new RectangleTool();
  const line = new LineTool();
  const circle = new CircleTool();
  const text = new TextTool();

  editor.setTool(pencil);

  const pencilBtn = document.getElementById("pencil");
  const eraserBtn = document.getElementById("eraser");
  const rectangleBtn = document.getElementById("rectangle");
  const lineBtn = document.getElementById("line");
  const circleBtn = document.getElementById("circle");
  const textBtn = document.getElementById("text");
  const undoBtn = document.getElementById("undo");
  const redoBtn = document.getElementById("redo");
  const saveBtn = document.getElementById("save");
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const onPencil = () => editor.setTool(pencil);
  pencilBtn?.addEventListener("click", onPencil);

  const onEraser = () => editor.setTool(eraser);
  eraserBtn?.addEventListener("click", onEraser);

  const onRectangle = () => editor.setTool(rectangle);
  rectangleBtn?.addEventListener("click", onRectangle);

  const onLine = () => editor.setTool(line);
  lineBtn?.addEventListener("click", onLine);

  const onCircle = () => editor.setTool(circle);
  circleBtn?.addEventListener("click", onCircle);

  const onText = () => editor.setTool(text);
  textBtn?.addEventListener("click", onText);

  const onUndo = () => editor.undo();
  undoBtn?.addEventListener("click", onUndo);

  const onRedo = () => editor.redo();
  redoBtn?.addEventListener("click", onRedo);

  const onSave = () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  };
  saveBtn?.addEventListener("click", onSave);

  const onImageLoader = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
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
  imageLoader?.addEventListener("change", onImageLoader);

  const destroy = () => {
    pencilBtn?.removeEventListener("click", onPencil);
    eraserBtn?.removeEventListener("click", onEraser);
    rectangleBtn?.removeEventListener("click", onRectangle);
    lineBtn?.removeEventListener("click", onLine);
    circleBtn?.removeEventListener("click", onCircle);
    textBtn?.removeEventListener("click", onText);
    undoBtn?.removeEventListener("click", onUndo);
    redoBtn?.removeEventListener("click", onRedo);
    saveBtn?.removeEventListener("click", onSave);
    imageLoader?.removeEventListener("change", onImageLoader);
    editor.destroy();
  };

  return { editor, destroy };
}


