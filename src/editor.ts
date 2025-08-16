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
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  const listeners: Array<() => void> = [];
  const bind = (
    el: HTMLElement | null,
    event: string,
    handler: EventListener,
  ) => {
    el?.addEventListener(event, handler);
    listeners.push(() => el?.removeEventListener(event, handler));
  };

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

  bind(document.getElementById("undo"), "click", () => editor.undo());
  bind(document.getElementById("redo"), "click", () => editor.redo());

  const saveHandler = () => {
    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = "canvas.png";
    a.click();
  };
  bind(saveBtn, "click", saveHandler);

  if (imageLoader) {
    const loadHandler = () => {
      const file = imageLoader.files && imageLoader.files[0];
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
    bind(imageLoader, "change", loadHandler);
  }

  return {
    editor,
    destroy: () => {
      listeners.forEach((fn) => fn());
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

