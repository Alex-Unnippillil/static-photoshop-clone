import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { EraserTool } from "./tools/EraserTool";


export function initEditor(): Editor {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById(
    "colorPicker",
  ) as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const eraser = new EraserTool();

  editor.setTool(pencil);
  const save = document.getElementById("save") as HTMLButtonElement;
  save.addEventListener("click", () => {
    const data = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = data;
    link.download = "canvas.png";
    link.click();
  });

  return editor;
}
