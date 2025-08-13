import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import { EraserTool } from "./tools/EraserTool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
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

  const toolButtons: Array<[string, any]> = [
    ["pencil", pencil],
    ["rectangle", rectangle],
    ["line", line],
    ["circle", circle],
    ["text", text],
    ["eraser", eraser],
  ];

  const cleanups: Array<() => void> = [];

  toolButtons.forEach(([id, tool]) => {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    if (!btn) return;
    const handler = () => editor.setTool(tool);
    btn.addEventListener("click", handler);
    cleanups.push(() => btn.removeEventListener("click", handler));
  });

  editor.setTool(pencil);

  const imageLoader = document.getElementById("imageLoader") as
    | HTMLInputElement
    | null;
  if (imageLoader) {
    const onChange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
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
    imageLoader.addEventListener("change", onChange);
    cleanups.push(() => imageLoader.removeEventListener("change", onChange));
  }

  const saveButton = document.getElementById("save") as
    | HTMLButtonElement
    | null;
  if (saveButton) {
    const onClick = () => {
      const link = document.createElement("a");
      link.href = editor.canvas.toDataURL("image/png");
      link.download = "canvas.png";
      link.click();
    };
    saveButton.addEventListener("click", onClick);
    cleanups.push(() => saveButton.removeEventListener("click", onClick));
  }

  const destroy = () => {
    cleanups.forEach((fn) => fn());
    editor.destroy();
  };

  return { editor, destroy };
}

