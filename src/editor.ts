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


  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;


  // Tool selection handlers
  const pencilHandler = () => editor.setTool(new PencilTool());
  const eraserHandler = () => editor.setTool(new EraserTool());
  const rectHandler = () => editor.setTool(new RectangleTool());
  const lineHandler = () => editor.setTool(new LineTool());
  const circleHandler = () => editor.setTool(new CircleTool());
  const textHandler = () => editor.setTool(new TextTool());
  pencilBtn?.addEventListener("click", pencilHandler);
  eraserBtn?.addEventListener("click", eraserHandler);
  rectBtn?.addEventListener("click", rectHandler);
  lineBtn?.addEventListener("click", lineHandler);
  circleBtn?.addEventListener("click", circleHandler);
  textBtn?.addEventListener("click", textHandler);


  // Save handler
  const saveHandler = () => {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "canvas.png";
    link.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

}

