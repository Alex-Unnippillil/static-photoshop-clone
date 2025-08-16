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

/**
 * Initialize the editor and wire DOM controls to it.
 * Returns the editor instance together with a destroy function
 * that removes all registered event listeners.
 */
export function initEditor(): EditorHandle {
  // Query required DOM elements
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const pencilBtn = document.getElementById("pencil");
  const eraserBtn = document.getElementById("eraser");
  const rectBtn = document.getElementById("rectangle");
  const lineBtn = document.getElementById("line");
  const circleBtn = document.getElementById("circle");
  const textBtn = document.getElementById("text");
  const undoBtn = document.getElementById("undo");
  const redoBtn = document.getElementById("redo");
  const saveBtn = document.getElementById("save");
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  // Instantiate editor and shortcuts
  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  // Default tool
  editor.setTool(new PencilTool());

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

  // Undo/redo handlers
  const undoHandler = () => editor.undo();
  const redoHandler = () => editor.redo();
  undoBtn?.addEventListener("click", undoHandler);
  redoBtn?.addEventListener("click", redoHandler);

  // Save handler
  const saveHandler = () => {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "canvas.png";
    link.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  // Image loader handler
  const loadHandler = () => {
    const file = imageLoader?.files?.[0];
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
  imageLoader?.addEventListener("change", loadHandler);

  // Destroy function to remove listeners
  const destroy = () => {
    pencilBtn?.removeEventListener("click", pencilHandler);
    eraserBtn?.removeEventListener("click", eraserHandler);
    rectBtn?.removeEventListener("click", rectHandler);
    lineBtn?.removeEventListener("click", lineHandler);
    circleBtn?.removeEventListener("click", circleHandler);
    textBtn?.removeEventListener("click", textHandler);
    undoBtn?.removeEventListener("click", undoHandler);
    redoBtn?.removeEventListener("click", redoHandler);
    saveBtn?.removeEventListener("click", saveHandler);
    imageLoader?.removeEventListener("change", loadHandler);

    shortcuts.destroy();
    editor.destroy();
  };

  return { editor, destroy };
}

