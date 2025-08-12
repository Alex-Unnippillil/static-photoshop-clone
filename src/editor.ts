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
  const imageLoader = document.getElementById("imageLoader") as
    | HTMLInputElement
    | null;
  const saveButton = document.getElementById("save") as
    | HTMLButtonElement
    | null;

  (document.getElementById("pencil") as HTMLButtonElement)?.addEventListener(
    "click",
    () => editor.setTool(pencil),
  );
  (document.getElementById("rectangle") as HTMLButtonElement)?.addEventListener(
    "click",
    () => editor.setTool(rectangle),
  );
  (document.getElementById("eraser") as HTMLButtonElement)?.addEventListener(
    "click",
    () => editor.setTool(eraser),
  );

  imageLoader?.addEventListener("change", () => {
    const file = imageLoader.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(img, 0, 0, editor.canvas.width, editor.canvas.height);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  saveButton?.addEventListener("click", () => {
    const data = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = data;
    link.download = "canvas.png";
    link.click();
  });

  editor.setTool(pencil);

  return editor;
}
