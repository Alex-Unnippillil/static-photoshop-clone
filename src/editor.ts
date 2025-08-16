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
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  const pencilHandler = () => editor.setTool(new PencilTool());
  const eraserHandler = () => editor.setTool(new EraserTool());
  const rectangleHandler = () => editor.setTool(new RectangleTool());
  const lineHandler = () => editor.setTool(new LineTool());
  const circleHandler = () => editor.setTool(new CircleTool());
  const textHandler = () => editor.setTool(new TextTool());

  document.getElementById("pencil")?.addEventListener("click", pencilHandler);
  document.getElementById("eraser")?.addEventListener("click", eraserHandler);
  document.getElementById("rectangle")?.addEventListener("click", rectangleHandler);
  document.getElementById("line")?.addEventListener("click", lineHandler);
  document.getElementById("circle")?.addEventListener("click", circleHandler);
  document.getElementById("text")?.addEventListener("click", textHandler);

  const undoHandler = () => editor.undo();
  const redoHandler = () => editor.redo();
  undoBtn?.addEventListener("click", undoHandler);
  redoBtn?.addEventListener("click", redoHandler);

  const imageHandler = () => {
    const file = imageLoader?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  imageLoader?.addEventListener("change", imageHandler);

  const saveHandler = () => {
    const canvases = Array.from(document.querySelectorAll("canvas"));
    let exportCanvas = canvases[0];
    if (canvases.length > 1) {
      const temp = document.createElement("canvas");
      temp.width = exportCanvas.width;
      temp.height = exportCanvas.height;
      const tempCtx = temp.getContext("2d")!;
      canvases.forEach((c) => {
        const opacity = parseFloat(c.style.opacity || "1");
        tempCtx.globalAlpha = opacity;
        tempCtx.drawImage(c, 0, 0);
      });
      exportCanvas = temp;
    }
    const data = exportCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = "canvas.png";
    a.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  return {
    editor,
    destroy: () => {
      document
        .getElementById("pencil")
        ?.removeEventListener("click", pencilHandler);
      document
        .getElementById("eraser")
        ?.removeEventListener("click", eraserHandler);
      document
        .getElementById("rectangle")
        ?.removeEventListener("click", rectangleHandler);
      document.getElementById("line")?.removeEventListener("click", lineHandler);
      document
        .getElementById("circle")
        ?.removeEventListener("click", circleHandler);
      document.getElementById("text")?.removeEventListener("click", textHandler);
      undoBtn?.removeEventListener("click", undoHandler);
      redoBtn?.removeEventListener("click", redoHandler);
      saveBtn?.removeEventListener("click", saveHandler);
      imageLoader?.removeEventListener("change", imageHandler);
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

