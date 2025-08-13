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
  editor.setTool(new PencilTool());

  const pencil = document.getElementById("pencil");
  const eraser = document.getElementById("eraser");
  const rectangle = document.getElementById("rectangle");
  const line = document.getElementById("line");
  const circle = document.getElementById("circle");
  const text = document.getElementById("text");
  const undo = document.getElementById("undo");
  const redo = document.getElementById("redo");
  const save = document.getElementById("save");
  const imageLoader = document.getElementById("imageLoader") as
    | HTMLInputElement
    | null;

  const pencilHandler = () => editor.setTool(new PencilTool());
  const eraserHandler = () => editor.setTool(new EraserTool());
  const rectangleHandler = () => editor.setTool(new RectangleTool());
  const lineHandler = () => editor.setTool(new LineTool());
  const circleHandler = () => editor.setTool(new CircleTool());
  const textHandler = () => editor.setTool(new TextTool());
  const undoHandler = () => editor.undo();
  const redoHandler = () => editor.redo();
  const saveHandler = () => {
    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = "canvas.png";
    a.click();
  };
  const imageLoaderHandler = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files && target.files[0];
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
  };

  pencil?.addEventListener("click", pencilHandler);
  eraser?.addEventListener("click", eraserHandler);
  rectangle?.addEventListener("click", rectangleHandler);
  line?.addEventListener("click", lineHandler);
  circle?.addEventListener("click", circleHandler);
  text?.addEventListener("click", textHandler);
  undo?.addEventListener("click", undoHandler);
  redo?.addEventListener("click", redoHandler);
  save?.addEventListener("click", saveHandler);
  imageLoader?.addEventListener("change", imageLoaderHandler);

  const destroy = () => {
    pencil?.removeEventListener("click", pencilHandler);
    eraser?.removeEventListener("click", eraserHandler);
    rectangle?.removeEventListener("click", rectangleHandler);
    line?.removeEventListener("click", lineHandler);
    circle?.removeEventListener("click", circleHandler);
    text?.removeEventListener("click", textHandler);
    undo?.removeEventListener("click", undoHandler);
    redo?.removeEventListener("click", redoHandler);
    save?.removeEventListener("click", saveHandler);
    imageLoader?.removeEventListener("change", imageLoaderHandler);
    editor.destroy();
  };

  return { editor, destroy };
}

