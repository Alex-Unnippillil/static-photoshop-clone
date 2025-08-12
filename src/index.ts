import { initEditor } from "./editor";
import { EraserTool } from "./tools/EraserTool";

const editor = initEditor();

const eraser = new EraserTool();
document.getElementById("eraser")?.addEventListener("click", () =>
  editor.setTool(eraser),
);

