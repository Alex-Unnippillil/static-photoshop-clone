import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { EraserTool } from "./tools/EraserTool";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

const editor = new Editor(canvas, colorPicker, lineWidth);

const pencil = new PencilTool();
const eraser = new EraserTool();
const rectangle = new RectangleTool();

editor.setTool(pencil);

document.getElementById("pencil")?.addEventListener("click", () =>
  editor.setTool(pencil),
);

document.getElementById("eraser")?.addEventListener("click", () =>
  editor.setTool(eraser),
);

document.getElementById("rectangle")?.addEventListener("click", () =>
  editor.setTool(rectangle),
);

document.getElementById("undo")?.addEventListener("click", () => editor.undo());
document.getElementById("redo")?.addEventListener("click", () => editor.redo());
