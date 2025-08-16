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
 * Initialize an editor on a specific canvas element.
 * @param canvasId The id of the canvas to enhance. Defaults to `canvas` so
 * existing tests that assume a single canvas continue to work.
 */
export function initEditor(canvasId = "canvas"): EditorHandle {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    throw new Error(`Canvas with id "${canvasId}" not found`);
  }

  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  // --- Tool Buttons --------------------------------------------------------
  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectangleBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;

  const setPencil = () => editor.setTool(new PencilTool());
  const setEraser = () => editor.setTool(new EraserTool());
  const setRectangle = () => editor.setTool(new RectangleTool());
  const setLine = () => editor.setTool(new LineTool());
  const setCircle = () => editor.setTool(new CircleTool());
  const setText = () => editor.setTool(new TextTool());
  const undo = () => editor.undo();
  const redo = () => editor.redo();

  pencilBtn?.addEventListener("click", setPencil);
  eraserBtn?.addEventListener("click", setEraser);
  rectangleBtn?.addEventListener("click", setRectangle);
  lineBtn?.addEventListener("click", setLine);
  circleBtn?.addEventListener("click", setCircle);
  textBtn?.addEventListener("click", setText);
  undoBtn?.addEventListener("click", undo);
  redoBtn?.addEventListener("click", redo);

  // --- Image Loading -------------------------------------------------------
  const imageHandler = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(
          img,
          0,
          0,
          canvas.clientWidth,
          canvas.clientHeight,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  imageLoader?.addEventListener("change", imageHandler);

  // --- Saving --------------------------------------------------------------
  const saveHandler = () => {
    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = "canvas.png";
    a.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  const destroy = () => {
    pencilBtn?.removeEventListener("click", setPencil);
    eraserBtn?.removeEventListener("click", setEraser);
    rectangleBtn?.removeEventListener("click", setRectangle);
    lineBtn?.removeEventListener("click", setLine);
    circleBtn?.removeEventListener("click", setCircle);
    textBtn?.removeEventListener("click", setText);
    undoBtn?.removeEventListener("click", undo);
    redoBtn?.removeEventListener("click", redo);
    saveBtn?.removeEventListener("click", saveHandler);
    imageLoader?.removeEventListener("change", imageHandler);
    shortcuts.destroy();
    editor.destroy();
  };

  return { editor, destroy };
}

