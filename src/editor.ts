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
  editors: Editor[];
  activateLayer(index: number): void;
  destroy(): void;
}

function listen(
  target: EventTarget | null,
  type: string,
  handler: (e: Event) => void,
  listeners: Array<() => void>,
) {
  if (!target) return;
  target.addEventListener(type, handler);
  listeners.push(() => target.removeEventListener(type, handler));
}

export function initEditor(canvasId?: string): EditorHandle {
  const canvases: HTMLCanvasElement[] = canvasId
    ? [document.getElementById(canvasId) as HTMLCanvasElement].filter(
        (c): c is HTMLCanvasElement => Boolean(c),
      )
    : Array.from(document.querySelectorAll<HTMLCanvasElement>("canvas"));

  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;

  const listeners: Array<() => void> = [];

  let editor: Editor;

  const updateHistoryButtons = () => {
    if (undoBtn) undoBtn.disabled = !editor?.canUndo;
    if (redoBtn) redoBtn.disabled = !editor?.canRedo;
  };

  const editors: Editor[] = [];
  canvases.forEach((c) => {
    try {
      editors.push(
        new Editor(c, colorPicker, lineWidth, fillMode, () => {
          updateHistoryButtons();
        }),
      );
    } catch {
      /* skip canvases without 2D context */
    }
  });

  editor = editors[0];

  editor.setTool(new PencilTool());

  const shortcuts = new Shortcuts(editor);

  const toolButtons: Record<string, new () => Tool> = {
    pencil: PencilTool,
    eraser: EraserTool,
    rectangle: RectangleTool,
    line: LineTool,
    circle: CircleTool,
    text: TextTool,
  };

  Object.entries(toolButtons).forEach(([id, ToolCtor]) =>
    listen(
      document.getElementById(id) as HTMLButtonElement | null,
      "click",
      () => editor.setTool(new ToolCtor()),
      listeners,
    ),
  );

  listen(
    undoBtn,
    "click",
    () => {
      editor.undo();
      updateHistoryButtons();
    },
    listeners,
  );

  listen(
    redoBtn,
    "click",
    () => {
      editor.redo();
      updateHistoryButtons();
    },
    listeners,
  );

  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  listen(
    saveBtn,
    "click",
    () => {
      const formatSelect = document.getElementById(
        "formatSelect",
      ) as HTMLSelectElement | null;
      const format = formatSelect?.value?.toLowerCase() === "jpeg" ? "jpeg" : "png";
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      const quality = format === "jpeg" ? 0.9 : undefined;

      let exportCanvas: HTMLCanvasElement;
      if (canvases.length > 1) {
        // composite all layers respecting their opacity
        exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvases[0].width;
        exportCanvas.height = canvases[0].height;
        const tempCtx = exportCanvas.getContext("2d")!;
        canvases.forEach((cv) => {
          const opacity = parseFloat(cv.style.opacity) || 1;
          tempCtx.globalAlpha = opacity;
          tempCtx.drawImage(cv, 0, 0);
        });
        tempCtx.globalAlpha = 1;
      } else {
        exportCanvas = editor.canvas;
      }

      const data = exportCanvas.toDataURL(mime, quality as any);
      const a = document.createElement("a");
      a.href = data;
      a.download = `canvas.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
    },
    listeners,
  );

  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  listen(
    imageLoader,
    "change",
    (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          editor.ctx.drawImage(img, 0, 0, editor.canvas.width, editor.canvas.height);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    listeners,
  );

  document
    .querySelectorAll<HTMLInputElement>('input[id$="Opacity"]')
    .forEach((input) => {
      const targetId = input.id.replace(/Opacity$/, "");
      const layer = document.getElementById(targetId) as HTMLCanvasElement | null;
      if (!layer) return;
      listen(
        input,
        "input",
        () => {
          const value = parseFloat(input.value);
          layer.style.opacity = isNaN(value) ? "1" : String(value / 100);
        },
        listeners,
      );
    });

  const layerSelect = document.getElementById("layerSelect") as HTMLSelectElement | null;
  listen(
    layerSelect,
    "change",
    () => {
      const idx = parseInt(layerSelect.value, 10);
      activateLayer(idx);
    },
    listeners,
  );

  function activateLayer(index: number) {
    if (index < 0 || index >= editors.length) return;
    editor = editors[index];
    handle.editor = editor;
    shortcuts.switchEditor(editor);
    updateHistoryButtons();
  }

  const handle: EditorHandle = {
    editor,
    editors,
    activateLayer,
    destroy() {
      listeners.forEach((fn) => fn());
      shortcuts.destroy();
      editors.forEach((e) => e.destroy());
    },
  };

  updateHistoryButtons();

  return handle;
}

