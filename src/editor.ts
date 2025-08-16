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
 * Initialise the editor and wire all toolbar controls.
 */
export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  const cleanups: Array<() => void> = [];
  const bind = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement | null,
    type: K,
    handler: (ev: HTMLElementEventMap[K]) => void,
  ) => {
    if (!el) return;
    el.addEventListener(type, handler);
    cleanups.push(() => el.removeEventListener(type, handler));
  };

  // Tool buttons
  bind(document.getElementById("pencil"), "click", () =>
    editor.setTool(new PencilTool()),
  );
  bind(document.getElementById("eraser"), "click", () =>
    editor.setTool(new EraserTool()),
  );
  bind(document.getElementById("rectangle"), "click", () =>
    editor.setTool(new RectangleTool()),
  );
  bind(document.getElementById("line"), "click", () =>
    editor.setTool(new LineTool()),
  );
  bind(document.getElementById("circle"), "click", () =>
    editor.setTool(new CircleTool()),
  );
  bind(document.getElementById("text"), "click", () =>
    editor.setTool(new TextTool()),
  );

  // Undo/redo
  bind(document.getElementById("undo"), "click", () => editor.undo());
  bind(document.getElementById("redo"), "click", () => editor.redo());

  // Save to image
  bind(document.getElementById("save"), "click", () => {
    const data = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = data;
    link.download = "canvas.png";
    link.click();
  });

  // Load image from file input and resize canvas to image dimensions
  const loader = document.getElementById("imageLoader") as
    | HTMLInputElement
    | null;
  bind(loader, "change", () => {
    const file = loader?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = `${img.width}px`;
        canvas.style.height = `${img.height}px`;
          canvas.width = img.width * dpr;
          canvas.height = img.height * dpr;
          editor.ctx.setTransform(1, 0, 0, 1, 0, 0);
          editor.ctx.scale(dpr, dpr);
          editor.ctx.drawImage(img, 0, 0, img.width, img.height);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  const destroy = () => {
    cleanups.forEach((fn) => fn());
    shortcuts.destroy();
    editor.destroy();
  };

  return { editor, destroy };
}

