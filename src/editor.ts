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
  const pencilBtn = document.getElementById("pencil");
  const eraserBtn = document.getElementById("eraser");
  const rectangleBtn = document.getElementById("rectangle");
  const lineBtn = document.getElementById("line");
  const circleBtn = document.getElementById("circle");
  const textBtn = document.getElementById("text");
  const undoBtn = document.getElementById("undo");
  const redoBtn = document.getElementById("redo");
  const saveBtn = document.getElementById("save");
  const saveJpegBtn = document.getElementById("saveJpeg");
  const imageLoader = document.getElementById("imageLoader");

  const listeners: Array<() => void> = [];
  function addListener<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | null,
    type: K,
    handler: (ev: any) => void,
  ) {
    if (!el) return;
    el.addEventListener(type, handler as any);
    listeners.push(() => el.removeEventListener(type, handler as any));
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

  function loadImage(src: string | ArrayBuffer | null) {
    const img = new Image();
    img.onload = () => {
      editor.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = src as string;
  }

  addListener(imageLoader, "change", (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result);
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
      loadImage(reader.result);
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

