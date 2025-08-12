import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import { EraserTool } from "./tools/EraserTool";

export function initEditor(): Editor {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const line = new LineTool();
  const circle = new CircleTool();
  const text = new TextTool();
  const eraser = new EraserTool();

  editor.setTool(pencil);

  function bindTool(id: string, tool: any) {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    btn?.addEventListener("click", () => editor.setTool(tool));
  }

  bindTool("pencil", pencil);
  bindTool("rectangle", rectangle);
  bindTool("line", line);
  bindTool("circle", circle);
  bindTool("text", text);
  bindTool("eraser", eraser);

  (document.getElementById("undo") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => editor.undo(),
  );
  (document.getElementById("redo") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => editor.redo(),
  );

  (document.getElementById("save") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => {
      const data = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = data;
      a.download = "canvas.png";
      a.click();
    },
  );

  const loader = document.getElementById("imageLoader") as HTMLInputElement | null;
  loader?.addEventListener("change", () => {
    const file = loader.files?.[0];
    if (!file) return;
    canvas.toDataURL();
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
  });

  return editor;
}
