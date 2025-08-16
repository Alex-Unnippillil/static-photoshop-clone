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
 * Initialize the editor and wire up all toolbar controls.
 */
export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  const layer2 = document.getElementById("layer2") as HTMLCanvasElement | null;
  const layer2Opacity = document.getElementById("layer2Opacity") as HTMLInputElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;

  const toolHandlers: Array<{ elem: HTMLButtonElement | null; handler: () => void }> = [
    { elem: pencilBtn, handler: () => editor.setTool(new PencilTool()) },
    { elem: eraserBtn, handler: () => editor.setTool(new EraserTool()) },
    { elem: rectBtn, handler: () => editor.setTool(new RectangleTool()) },
    { elem: lineBtn, handler: () => editor.setTool(new LineTool()) },
    { elem: circleBtn, handler: () => editor.setTool(new CircleTool()) },
    { elem: textBtn, handler: () => editor.setTool(new TextTool()) },
  ];

  toolHandlers.forEach(({ elem, handler }) => elem?.addEventListener("click", handler));

  const undoHandler = () => editor.undo();
  const redoHandler = () => editor.redo();
  undoBtn?.addEventListener("click", undoHandler);
  redoBtn?.addEventListener("click", redoHandler);

  const saveHandler = () => {
    let dataURL: string;
    if (layer2) {
      const temp = document.createElement("canvas");
      temp.width = canvas.width;
      temp.height = canvas.height;
      const tctx = temp.getContext("2d");
      if (!tctx) throw new Error("Unable to get 2D context");
      tctx.drawImage(canvas, 0, 0);
      const opacity = layer2Opacity ? Number(layer2Opacity.value) / 100 : 1;
      tctx.globalAlpha = opacity;
      tctx.drawImage(layer2, 0, 0);
      dataURL = temp.toDataURL("image/png");
    } else {
      dataURL = canvas.toDataURL("image/png");
    }
    const anchor = document.createElement("a");
    anchor.href = dataURL;
    anchor.download = "canvas.png";
    anchor.click();
  };
  saveBtn?.addEventListener("click", saveHandler);

  const imageHandler = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => editor.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  imageLoader?.addEventListener("change", imageHandler);

  const opacityHandler = () => {
    if (!layer2 || !layer2Opacity) return;
    const value = Number(layer2Opacity.value) / 100;
    layer2.style.opacity = value.toString();
  };
  layer2Opacity?.addEventListener("input", opacityHandler);
  opacityHandler();

  return {
    editor,
    destroy() {
      toolHandlers.forEach(({ elem, handler }) => elem?.removeEventListener("click", handler));
      undoBtn?.removeEventListener("click", undoHandler);
      redoBtn?.removeEventListener("click", redoHandler);
      saveBtn?.removeEventListener("click", saveHandler);
      imageLoader?.removeEventListener("change", imageHandler);
      layer2Opacity?.removeEventListener("input", opacityHandler);
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

