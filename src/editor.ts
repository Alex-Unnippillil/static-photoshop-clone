import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";

export function initEditor(): Editor {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);
  editor.setTool(new PencilTool());
  return editor;
}

