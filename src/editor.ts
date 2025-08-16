import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import { Tool } from "./tools/Tool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
}

/**
 * Initialise the editor and wire up DOM controls to the {@link Editor}
 * instance. A handle is returned so tests and consumers can clean up all
 * listeners when they are finished with the editor.
 */
export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  // Helper to attach tool switching buttons
  const bindTool = (id: string, tool: Tool) => {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    const handler = () => editor.setTool(tool);
    btn?.addEventListener("click", handler);
    return () => btn?.removeEventListener("click", handler);
  };

  const unbindPencil = bindTool("pencil", new PencilTool());
  const unbindEraser = bindTool("eraser", new EraserTool());
  const unbindRect = bindTool("rectangle", new RectangleTool());
  const unbindLine = bindTool("line", new LineTool());
  const unbindCircle = bindTool("circle", new CircleTool());
  const unbindText = bindTool("text", new TextTool());

  // Undo / redo buttons
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const undoHandler = () => editor.undo();
  const redoHandler = () => editor.redo();
  undoBtn?.addEventListener("click", undoHandler);
  redoBtn?.addEventListener("click", redoHandler);

  // Save canvas as an image
  const saveHandler = () => {
    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = "canvas.png";
    a.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  // Load image from file input
  const loadHandler = () => {
    const file = imageLoader?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        if (imgRatio > canvasRatio) {
          // Image is wider than canvas
          drawHeight = canvas.width / imgRatio;
        } else {
          // Image is taller than canvas
          drawWidth = canvas.height * imgRatio;
        }
        editor.ctx.clearRect(0, 0, canvas.width, canvas.height);
        editor.ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };
  imageLoader?.addEventListener("change", loadHandler);

  const destroy = () => {
    unbindPencil();
    unbindEraser();
    unbindRect();
    unbindLine();
    unbindCircle();
    unbindText();
    undoBtn?.removeEventListener("click", undoHandler);
    redoBtn?.removeEventListener("click", redoHandler);
    saveBtn?.removeEventListener("click", saveHandler);
    imageLoader?.removeEventListener("change", loadHandler);
    shortcuts.destroy();
    editor.destroy();
  };

  return { editor, destroy };
}

