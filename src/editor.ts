import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { EraserTool } from "./tools/EraserTool";

export function initEditor(): Editor {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const eraser = new EraserTool();

  editor.setTool(pencil);

  document.getElementById("pencil")?.addEventListener("click", () =>
    editor.setTool(pencil),
  );

  document.getElementById("rectangle")?.addEventListener("click", () =>
    editor.setTool(rectangle),
  );

  document.getElementById("eraser")?.addEventListener("click", () =>
    editor.setTool(eraser),
  );

  document.getElementById("undo")?.addEventListener("click", () =>
    editor.undo(),
  );
  document.getElementById("redo")?.addEventListener("click", () =>
    editor.redo(),
  );

  const imageLoader = document.getElementById("imageLoader") as
    | HTMLInputElement
    | null;
  imageLoader?.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        editor.ctx.drawImage(img, 0, 0);
      };
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("save")?.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = editor.canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  });

  return editor;
}

