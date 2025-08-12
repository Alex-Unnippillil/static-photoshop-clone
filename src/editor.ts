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

  return editor;
}

