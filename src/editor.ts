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
  /** Array of editors, one for each canvas layer. */
  editors: Editor[];
  /** Returns the editor for the currently active layer. */
  readonly editor: Editor;
  /** Clean up all listeners and editors. */
  destroy: () => void;
}


  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const layerSelect = document.getElementById("layerSelect") as HTMLSelectElement | null;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;

  const editors = canvases.map(
    (c) => new Editor(c, colorPicker, lineWidth, fillMode),
  );

  let currentLayerIndex = 0;
  const getActiveEditor = () => editors[currentLayerIndex];

  function updateCanvasInteraction() {
    canvases.forEach((c, idx) => {
      c.style.pointerEvents = idx === currentLayerIndex ? "auto" : "none";
    });
  }
  updateCanvasInteraction();

  // Keyboard shortcuts operate on the active editor.
  const shortcuts = new Shortcuts(getActiveEditor);


  const shortcuts = new Shortcuts(editor);


  };

  const imageHandler = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
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
  imageLoader?.addEventListener("change", imageHandler);

  return {
    editor,
    destroy() {
      shortcuts.destroy();
      saveBtn?.removeEventListener("click", saveHandler);
      imageLoader?.removeEventListener("change", imageHandler);
    },
  };
}

