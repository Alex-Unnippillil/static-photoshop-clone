import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";

export interface EditorHandle {
  /** Array of editors, one for each canvas layer. */
  editors: Editor[];
  /** Returns the editor for the currently active layer. */
  readonly editor: Editor;
  /** Clean up all listeners and editors. */
  destroy: () => void;
}

/**
 * Initialize editors and wire toolbar controls.
 * Supports multiple canvas layers with a select element (id="layerSelect")
 * to choose the active layer.
 */
export function initEditor(): EditorHandle {
  const canvases: HTMLCanvasElement[] = [];
  const primary = document.getElementById("canvas") as HTMLCanvasElement | null;
  const secondary = document.getElementById("canvas2") as HTMLCanvasElement | null;
  if (primary) canvases.push(primary);
  if (secondary) canvases.push(secondary);
  if (canvases.length === 0) {
    throw new Error("No canvas elements found");
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

  // Tool button handlers
  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;

  const pencilHandler = () => getActiveEditor().setTool(new PencilTool());
  const eraserHandler = () => getActiveEditor().setTool(new EraserTool());
  const rectHandler = () => getActiveEditor().setTool(new RectangleTool());
  const lineHandler = () => getActiveEditor().setTool(new LineTool());
  const circleHandler = () => getActiveEditor().setTool(new CircleTool());
  const textHandler = () => getActiveEditor().setTool(new TextTool());

  pencilBtn?.addEventListener("click", pencilHandler);
  eraserBtn?.addEventListener("click", eraserHandler);
  rectBtn?.addEventListener("click", rectHandler);
  lineBtn?.addEventListener("click", lineHandler);
  circleBtn?.addEventListener("click", circleHandler);
  textBtn?.addEventListener("click", textHandler);

  const undoHandler = () => getActiveEditor().undo();
  const redoHandler = () => getActiveEditor().redo();
  undoBtn?.addEventListener("click", undoHandler);
  redoBtn?.addEventListener("click", redoHandler);

  const layerHandler = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    currentLayerIndex = parseInt(target.value, 10) || 0;
    updateCanvasInteraction();
  };
  layerSelect?.addEventListener("change", layerHandler);

  const saveHandler = () => {
    const url = getActiveEditor().canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "canvas.png";
    a.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  const loadHandler = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        getActiveEditor().ctx.drawImage(img, 0, 0);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  imageLoader?.addEventListener("change", loadHandler);

  return {
    editors,
    get editor() {
      return getActiveEditor();
    },
    destroy() {
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
      layerSelect?.removeEventListener("change", layerHandler);
      shortcuts.destroy();
      editors.forEach((e) => e.destroy());
    },
  };
}

