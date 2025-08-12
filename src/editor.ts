import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { EraserTool } from "./tools/EraserTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";

export function initEditor(): Editor {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  const saveButton = document.getElementById("save") as HTMLButtonElement | null;
  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const eraser = new EraserTool();
  const line = new LineTool();
  const circle = new CircleTool();
  const text = new TextTool();

  editor.setTool(pencil);

  pencilBtn?.addEventListener("click", () => editor.setTool(pencil));
  eraserBtn?.addEventListener("click", () => editor.setTool(eraser));
  rectBtn?.addEventListener("click", () => editor.setTool(rectangle));
  lineBtn?.addEventListener("click", () => editor.setTool(line));
  circleBtn?.addEventListener("click", () => editor.setTool(circle));
  textBtn?.addEventListener("click", () => editor.setTool(text));

  imageLoader?.addEventListener("change", () => {
    const file = imageLoader.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(img, 0, 0);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  saveButton?.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  });

  return editor;
}
