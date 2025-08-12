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

  const bind = (id: string, tool: any) => {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    btn?.addEventListener("click", () => editor.setTool(tool));
  };

  bind("pencil", pencil);
  bind("rectangle", rectangle);
  bind("eraser", eraser);
  bind("line", line);
  bind("circle", circle);
  bind("text", text);

  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  undoBtn?.addEventListener("click", () => editor.undo());

  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  redoBtn?.addEventListener("click", () => editor.redo());

  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  saveBtn?.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = editor.canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  });

  const loader = document.getElementById("imageLoader") as HTMLInputElement | null;
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
