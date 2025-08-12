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

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const eraser = new EraserTool();
  const line = new LineTool();
  const circle = new CircleTool();
  const text = new TextTool();

  editor.setTool(pencil);

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
  (document.getElementById("line") as HTMLButtonElement)?.addEventListener(
    "click",
    () => editor.setTool(line),
  );
  (document.getElementById("circle") as HTMLButtonElement)?.addEventListener(
    "click",
    () => editor.setTool(circle),
  );
  (document.getElementById("text") as HTMLButtonElement)?.addEventListener(
    "click",
    () => editor.setTool(text),
  );

  (document.getElementById("undo") as HTMLButtonElement)?.addEventListener(
    "click",
    () => editor.undo(),
  );
  (document.getElementById("redo") as HTMLButtonElement)?.addEventListener(
    "click",
    () => editor.redo(),
  );

  (document.getElementById("save") as HTMLButtonElement)?.addEventListener(
    "click",
    () => {
      const data = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = data;
      a.download = "canvas.png";
      a.click();
    },
  );

  const loader = document.getElementById("imageLoader") as HTMLInputElement;
  loader?.addEventListener("change", () => {
    const file = loader.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        canvas.toDataURL();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  return editor;
}
