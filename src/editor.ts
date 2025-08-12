import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";

export function initEditor(): Editor {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const line = new LineTool();
  const circle = new CircleTool();
  const text = new TextTool();

  editor.setTool(pencil);

  document.getElementById("pencil")?.addEventListener("click", () =>
    editor.setTool(pencil),
  );

  document.getElementById("rectangle")?.addEventListener("click", () =>
    editor.setTool(rectangle),
  );

  document.getElementById("line")?.addEventListener("click", () =>
    editor.setTool(line),
  );

  document.getElementById("circle")?.addEventListener("click", () =>
    editor.setTool(circle),
  );

  document.getElementById("text")?.addEventListener("click", () =>
    editor.setTool(text),
  );

  document.getElementById("undo")?.addEventListener("click", () =>
    editor.undo(),
  );
  document.getElementById("redo")?.addEventListener("click", () =>
    editor.redo(),
  );

  return editor;
}

