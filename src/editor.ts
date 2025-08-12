import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";

export function initEditor(): Editor {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();

  editor.setTool(pencil);

  document.getElementById("pencil")?.addEventListener("click", () =>
    editor.setTool(pencil),
  );

  document.getElementById("rectangle")?.addEventListener("click", () =>
    editor.setTool(rectangle),
  );

  document.getElementById("undo")?.addEventListener("click", () =>
    editor.undo(),
  );
  document.getElementById("redo")?.addEventListener("click", () =>
    editor.redo(),
  );

  document.getElementById("imageLoader")?.addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.saveState();
        editor.ctx.drawImage(
          img,
          0,
          0,
          editor.canvas.clientWidth,
          editor.canvas.clientHeight,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

  return editor;
}

