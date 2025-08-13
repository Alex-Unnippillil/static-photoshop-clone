import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import { EraserTool } from "./tools/EraserTool";

export interface EditorHandle {
  destroy(): void;
  editor: Editor;
}

export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const line = new LineTool();
  const circle = new CircleTool();
  const text = new TextTool();
  const eraser = new EraserTool();

  const tools: Record<string, any> = {
    pencil,
    rectangle,
    line,
    circle,
    text,
    eraser,
  };

  editor.setTool(pencil);

  Object.entries(tools).forEach(([id, tool]) => {
    const btn = document.getElementById(id);
    btn?.addEventListener("click", () => editor.setTool(tool));
  });

  document.getElementById("undo")?.addEventListener("click", () => editor.undo());
  document.getElementById("redo")?.addEventListener("click", () => editor.redo());

  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  imageLoader?.addEventListener("change", () => {
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
          editor.canvas.width,
          editor.canvas.height,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  saveBtn?.addEventListener("click", () => {
    const dataUrl = editor.canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "canvas.png";
    a.click();
  });

  return {
    destroy() {
      editor.destroy();
    },
    editor,
  };
}
