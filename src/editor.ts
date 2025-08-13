import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";

export function initEditor() {
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

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement;
  const rectangleBtn = document.getElementById("rectangle") as HTMLButtonElement;
  const lineBtn = document.getElementById("line") as HTMLButtonElement;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement;
  const textBtn = document.getElementById("text") as HTMLButtonElement;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement;
  const imageLoader = document.getElementById("imageLoader") as
    | HTMLInputElement
    | null;
  const saveButton = document.getElementById("save") as
    | HTMLButtonElement
    | null;

  const onPencil = () => editor.setTool(pencil);
  const onEraser = () => editor.setTool(eraser);
  const onRectangle = () => editor.setTool(rectangle);
  const onLine = () => editor.setTool(line);
  const onCircle = () => editor.setTool(circle);
  const onText = () => editor.setTool(text);
  const onUndo = () => editor.undo();
  const onRedo = () => editor.redo();
  const onLoadImage = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.clearRect(0, 0, editor.canvas.width, editor.canvas.height);
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
  };

  const onSave = () => {
    const link = document.createElement("a");
    link.href = editor.canvas.toDataURL("image/png");
    link.download = "image.png";
    link.click();
  };

  pencilBtn.addEventListener("click", onPencil);
  eraserBtn.addEventListener("click", onEraser);
  rectangleBtn.addEventListener("click", onRectangle);
  lineBtn.addEventListener("click", onLine);
  circleBtn.addEventListener("click", onCircle);
  textBtn.addEventListener("click", onText);
  undoBtn.addEventListener("click", onUndo);
  redoBtn.addEventListener("click", onRedo);
  imageLoader?.addEventListener("change", onLoadImage);
  saveButton?.addEventListener("click", onSave);

  function destroy() {
    editor.destroy();
    pencilBtn.removeEventListener("click", onPencil);
    eraserBtn.removeEventListener("click", onEraser);
    rectangleBtn.removeEventListener("click", onRectangle);
    lineBtn.removeEventListener("click", onLine);
    circleBtn.removeEventListener("click", onCircle);
    textBtn.removeEventListener("click", onText);
    undoBtn.removeEventListener("click", onUndo);
    redoBtn.removeEventListener("click", onRedo);
    imageLoader?.removeEventListener("change", onLoadImage);
    saveButton?.removeEventListener("click", onSave);
  }

  return { editor, destroy };
}

