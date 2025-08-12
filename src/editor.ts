import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { EraserTool } from "./tools/EraserTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";


export function initEditor(): Editor {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById(
    "colorPicker",
  ) as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement;
  const rectangleBtn = document.getElementById("rectangle") as HTMLButtonElement;
  const lineBtn = document.getElementById("line") as HTMLButtonElement;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement;
  const textBtn = document.getElementById("text") as HTMLButtonElement;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const eraser = new EraserTool();
  const line = new LineTool();
  const circle = new CircleTool();
  const text = new TextTool();

  editor.setTool(pencil);

  pencilBtn.onclick = () => editor.setTool(pencil);
  eraserBtn.onclick = () => editor.setTool(eraser);
  rectangleBtn.onclick = () => editor.setTool(rectangle);
  lineBtn.onclick = () => editor.setTool(line);
  circleBtn.onclick = () => editor.setTool(circle);
  textBtn.onclick = () => editor.setTool(text);

  undoBtn.onclick = () => editor.undo();
  redoBtn.onclick = () => editor.redo();

  saveBtn.onclick = () => {
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = "canvas.png";
    link.click();
  };

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
          editor.canvas.clientWidth,
          editor.canvas.clientHeight,
        );
        canvas.toDataURL();
        editor.saveState();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  return editor;
}
