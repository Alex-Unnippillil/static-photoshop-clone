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

/**
 * Initialize the editor by wiring up DOM controls and returning an
 * {@link EditorHandle} that allows tests or callers to tear down the editor.
 */
export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  // Default tool
  editor.setTool(new PencilTool());

  const shortcuts = new Shortcuts(editor);

  // Tool buttons
  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectangleBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const saveJpegBtn = document.getElementById("saveJpeg") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const listeners: Array<() => void> = [];

  function addListener<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | null,
    type: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  ) {
    if (!el) return;
    el.addEventListener(type, handler as EventListener);
    listeners.push(() => el.removeEventListener(type, handler as EventListener));
  }

  addListener(pencilBtn, "click", () => editor.setTool(new PencilTool()));
  addListener(eraserBtn, "click", () => editor.setTool(new EraserTool()));
  addListener(rectangleBtn, "click", () => editor.setTool(new RectangleTool()));
  addListener(lineBtn, "click", () => editor.setTool(new LineTool()));
  addListener(circleBtn, "click", () => editor.setTool(new CircleTool()));
  addListener(textBtn, "click", () => editor.setTool(new TextTool()));
  addListener(undoBtn, "click", () => editor.undo());
  addListener(redoBtn, "click", () => editor.redo());

  function saveAs(type: string, fileName: string) {
    const data = canvas.toDataURL(type);
    const a = document.createElement("a");
    a.href = data;
    a.download = fileName;
    a.click();
  }

  addListener(saveBtn, "click", () => saveAs("image/png", "canvas.png"));
  addListener(saveJpegBtn, "click", () => saveAs("image/jpeg", "canvas.jpg"));

  function loadImage(src: string) {
    const img = new Image();
    img.onload = () => {
      editor.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = src;
  }

  addListener(imageLoader, "change", (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      loadImage(result);
    };
    reader.readAsDataURL(file);
  });

  // Support drag & drop image loading
  addListener(canvas, "dragover", (e: DragEvent) => {
    e.preventDefault();
  });
  addListener(canvas, "drop", (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  });

  return {
    editor,
    destroy: () => {
      listeners.forEach((fn) => fn());
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

