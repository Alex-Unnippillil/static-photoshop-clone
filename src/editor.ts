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

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement;
  const rectBtn = document.getElementById("rectangle") as HTMLButtonElement;
  const lineBtn = document.getElementById("line") as HTMLButtonElement;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement;
  const textBtn = document.getElementById("text") as HTMLButtonElement;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  editor.setTool(new PencilTool());
  const shortcuts = new Shortcuts(editor);

  const cleanups: Array<() => void> = [];

  function on<T extends HTMLElement>(
    el: T,
    event: keyof HTMLElementEventMap,
    handler: (e: any) => void,
  ) {
    el.addEventListener(event, handler as any);
    cleanups.push(() => el.removeEventListener(event, handler as any));
  }

  on(pencilBtn, "click", () => editor.setTool(new PencilTool()));
  on(eraserBtn, "click", () => editor.setTool(new EraserTool()));
  on(rectBtn, "click", () => editor.setTool(new RectangleTool()));
  on(lineBtn, "click", () => editor.setTool(new LineTool()));
  on(circleBtn, "click", () => editor.setTool(new CircleTool()));
  on(textBtn, "click", () => editor.setTool(new TextTool()));
  on(undoBtn, "click", () => editor.undo());
  on(redoBtn, "click", () => editor.redo());

  on(imageLoader, "change", () => {
    const file = imageLoader.files && imageLoader.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        editor.ctx.drawImage(
          img,
          0,
          0,
          editor.canvas.width,
          editor.canvas.height,
        );
      };
    };
    reader.readAsDataURL(file);
  });

  on(saveBtn, "click", () => {
    const link = document.createElement("a");
    link.href = editor.canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  });

  return {
    editor,
    destroy() {
      cleanups.forEach((fn) => fn());
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

