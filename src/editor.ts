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
 * Initialize the editor by wiring up toolbar controls and returning a handle
 * that can be used to destroy the instance and remove listeners.
 */
export const initEditor = (): EditorHandle => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  const formatSelect = document.getElementById("formatSelect") as HTMLSelectElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);
  // Default to pencil tool so drawing works out of the box
  editor.setTool(new PencilTool());

  // -- Tool selection -------------------------------------------------------
  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;

  const selectPencil = () => editor.setTool(new PencilTool());
  const selectEraser = () => editor.setTool(new EraserTool());
  const selectRect = () => editor.setTool(new RectangleTool());
  const selectLine = () => editor.setTool(new LineTool());
  const selectCircle = () => editor.setTool(new CircleTool());
  const selectText = () => editor.setTool(new TextTool());
  pencilBtn?.addEventListener("click", selectPencil);
  eraserBtn?.addEventListener("click", selectEraser);
  rectBtn?.addEventListener("click", selectRect);
  lineBtn?.addEventListener("click", selectLine);
  circleBtn?.addEventListener("click", selectCircle);
  textBtn?.addEventListener("click", selectText);

  const undo = () => editor.undo();
  const redo = () => editor.redo();
  undoBtn?.addEventListener("click", undo);
  redoBtn?.addEventListener("click", redo);

  // -- Image loading --------------------------------------------------------
  const loadImage = () => {
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
  imageLoader?.addEventListener("change", loadImage);

  // -- Saving ---------------------------------------------------------------
  const saveHandler = () => {
    const format = formatSelect?.value || "png";
    const mimeType = `image/${format}`;
    const dataURL =
      format === "jpeg"
        ? canvas.toDataURL(mimeType, 0.9)
        : canvas.toDataURL(mimeType);
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `canvas.${format === "jpeg" ? "jpg" : "png"}`;
    link.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  return {
    editor,
    destroy() {
      shortcuts.destroy();
      pencilBtn?.removeEventListener("click", selectPencil);
      eraserBtn?.removeEventListener("click", selectEraser);
      rectBtn?.removeEventListener("click", selectRect);
      lineBtn?.removeEventListener("click", selectLine);
      circleBtn?.removeEventListener("click", selectCircle);
      textBtn?.removeEventListener("click", selectText);
      undoBtn?.removeEventListener("click", undo);
      redoBtn?.removeEventListener("click", redo);
      imageLoader?.removeEventListener("change", loadImage);
      saveBtn?.removeEventListener("click", saveHandler);
      editor.destroy();
    },
  };
};

