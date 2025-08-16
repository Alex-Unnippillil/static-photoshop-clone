import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import { Tool } from "./tools/Tool";

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
  editor.setTool(new PencilTool());

  const shortcuts = new Shortcuts(editor);

  const toolButtons: Record<string, () => Tool> = {
    pencil: () => new PencilTool(),
    eraser: () => new EraserTool(),
    rectangle: () => new RectangleTool(),
    line: () => new LineTool(),
    circle: () => new CircleTool(),
    text: () => new TextTool(),
  };

  Object.entries(toolButtons).forEach(([id, factory]) => {
    document.getElementById(id)?.addEventListener("click", () => {
      editor.setTool(factory());
    });
  });

  document.getElementById("undo")?.addEventListener("click", () => editor.undo());
  document.getElementById("redo")?.addEventListener("click", () => editor.redo());

  const saveHandler = () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  const imageHandler = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  imageLoader?.addEventListener("change", imageHandler);

  return {
    editor,
    destroy() {
      shortcuts.destroy();
      saveBtn?.removeEventListener("click", saveHandler);
      imageLoader?.removeEventListener("change", imageHandler);
    },
  };
}

