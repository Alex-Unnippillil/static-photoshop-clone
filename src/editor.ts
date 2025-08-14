import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
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
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  editor.setTool(new PencilTool());
  const shortcuts = new Shortcuts(editor);

  const pencil = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraser = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectangle = document.getElementById("rectangle") as HTMLButtonElement | null;
  const line = document.getElementById("line") as HTMLButtonElement | null;
  const circle = document.getElementById("circle") as HTMLButtonElement | null;
  const text = document.getElementById("text") as HTMLButtonElement | null;
  const undo = document.getElementById("undo") as HTMLButtonElement | null;
  const redo = document.getElementById("redo") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  const save = document.getElementById("save") as HTMLButtonElement | null;

  const listeners: Array<{
    el: HTMLElement;
    type: string;
    handler: EventListenerOrEventListenerObject;
  }> = [];

  function addListener(
    el: HTMLElement | null,
    type: string,
    handler: EventListenerOrEventListenerObject,
  ) {
    if (!el) return;
    el.addEventListener(type, handler);
    listeners.push({ el, type, handler });
  }

  addListener(pencil, "click", () => editor.setTool(new PencilTool()));
  addListener(eraser, "click", () => editor.setTool(new EraserTool()));
  addListener(rectangle, "click", () => editor.setTool(new RectangleTool()));
  addListener(line, "click", () => editor.setTool(new LineTool()));
  addListener(circle, "click", () => editor.setTool(new CircleTool()));
  addListener(text, "click", () => editor.setTool(new TextTool()));
  addListener(undo, "click", () => editor.undo());
  addListener(redo, "click", () => editor.redo());
  addListener(save, "click", () => {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "canvas.png";
    link.click();
  });
  addListener(imageLoader, "change", (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  return {
    editor,
    destroy() {
      listeners.forEach(({ el, type, handler }) =>
        el.removeEventListener(type, handler),
      );
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

