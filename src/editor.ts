import { Editor } from "./core/Editor.js";
import { Shortcuts } from "./core/Shortcuts.js";
import { PencilTool } from "./tools/PencilTool.js";
import { EraserTool } from "./tools/EraserTool.js";
import { RectangleTool } from "./tools/RectangleTool.js";
import { LineTool } from "./tools/LineTool.js";
import { CircleTool } from "./tools/CircleTool.js";
import { TextTool } from "./tools/TextTool.js";
import { BucketFillTool } from "./tools/BucketFillTool.js";
import { EyedropperTool } from "./tools/EyedropperTool.js";
import type { Tool } from "./tools/Tool.js";

/** Utility to listen to events and auto-remove on destroy. */
function listen<T extends Event>(
  el: HTMLElement | null,
  type: string,
  handler: (e: T) => void,
  list: Array<() => void>,
) {
  if (!el) return;
  const wrapped = handler as EventListener;
  el.addEventListener(type, wrapped);
  list.push(() => el.removeEventListener(type, wrapped));
}

export interface EditorHandle {
  editor: Editor;
  editors: Editor[];
  activateLayer(index: number): void;
  destroy(): void;
}

/**
 * Initialize the editor by wiring up DOM controls and returning an
 * {@link EditorHandle} that allows tests or callers to tear down the editor.
 */
export function initEditor(): EditorHandle {
  const canvases = Array.from(
    document.querySelectorAll<HTMLCanvasElement>("canvas"),
  );

  const toolConstructors: Record<string, new () => Tool> = {
    pencil: PencilTool,
    eraser: EraserTool,
    rectangle: RectangleTool,
    line: LineTool,
    circle: CircleTool,
    text: TextTool,
    bucket: BucketFillTool,
    eyedropper: EyedropperTool,
  };

  const toolButtons: Record<string, HTMLButtonElement> = {};
  Object.keys(toolConstructors).forEach((id) => {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    if (!btn) {
      throw new Error(`Missing #${id} button`);
    }
    toolButtons[id] = btn;
  });

  let activeButton: HTMLButtonElement | null = null;
  const setActiveButton = (btn: HTMLButtonElement | null) => {
    if (activeButton) activeButton.classList.remove("active");
    if (btn) btn.classList.add("active");
    activeButton = btn;
  };
  const buttonForTool = (tool: Tool): HTMLButtonElement | null => {
    for (const [id, ToolCtor] of Object.entries(toolConstructors)) {
      if (tool instanceof ToolCtor) {
        return toolButtons[id];
      }
    }
    return null;
  };

  const colorPicker =
    document.getElementById("colorPicker") as HTMLInputElement | null;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement | null;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement | null;
  const fontFamily = document.getElementById("fontFamily") as HTMLSelectElement | null;
  const fontSize = document.getElementById("fontSize") as HTMLInputElement | null;
  const layerSelect = document.getElementById("layerSelect") as HTMLSelectElement | null;
  const toolbar = document.getElementById("toolbar") || document.body;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const formatSelect =
    document.getElementById("formatSelect") as HTMLSelectElement | null;

  if (!colorPicker) {
    throw new Error("Missing #colorPicker input");
  }
  if (!lineWidth) {
    throw new Error("Missing #lineWidth input");
  }
  if (!fillMode) {
    throw new Error("Missing #fillMode input");
  }
  if (!saveBtn) {
    throw new Error("Missing #save button");
  }
  if (!formatSelect) {
    throw new Error("Missing #formatSelect select");
  }

  if (layerSelect) {
    layerSelect.innerHTML = "";
  }

  canvases.forEach((c, i) => {
    const canvasId = c.id || `layer${i + 1}`;
    const name = c.id || `Layer ${i + 1}`;

    if (layerSelect) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = name;
      layerSelect.appendChild(opt);
    }

    if (!document.getElementById(`${canvasId}Opacity`) && i > 0) {
      const group = document.createElement("div");
      group.className = "group";

      const label = document.createElement("label");
      label.htmlFor = `${canvasId}Opacity`;
      label.textContent = `${name} Opacity`;

      const input = document.createElement("input");
      input.id = `${canvasId}Opacity`;
      input.type = "number";
      input.min = "0";
      input.max = "100";
      input.value = "100";

      group.appendChild(label);
      group.appendChild(input);
      toolbar.appendChild(group);
    }
  });

  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const listeners: Array<() => void> = [];

  let editor: Editor; // set after editors created

  const updateHistoryButtons = () => {
    if (undoBtn) undoBtn.disabled = !editor?.canUndo;
    if (redoBtn) redoBtn.disabled = !editor?.canRedo;
  };

  const editors: Editor[] = [];
  canvases.forEach((c) => {
    try {
      editors.push(
        new Editor(
          c,
          colorPicker,
          lineWidth,
          fillMode,
          () => {
            updateHistoryButtons();
          },
          fontFamily ?? undefined,
          fontSize ?? undefined,
        ),
      );
    } catch {
      /* skip canvases without 2D context */
    }
  });

  if (editors.length === 0) {
    throw new Error(
      "initEditor() requires at least one <canvas> element with a 2D context",
    );
  }

  editors.forEach((e) => {
    const original = e.setTool.bind(e);
    e.setTool = (tool: Tool) => {
      original(tool);
      setActiveButton(buttonForTool(tool));
    };
  });

  // active editor defaults to the first successfully created editor
  editor = editors[0];

  // default tool
  editor.setTool(new PencilTool());

  // keyboard shortcuts
  const shortcuts = new Shortcuts(editor);

  // map button id to tool constructor
  Object.entries(toolConstructors).forEach(([id, ToolCtor]) =>
    listen(toolButtons[id], "click", () => editor.setTool(new ToolCtor()), listeners),
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

  // saving
  listen(
    saveBtn,
    "click",
    () => {
      const format =
        formatSelect.value.toLowerCase() === "jpeg" ? "jpeg" : "png";
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

      const data =
        quality !== undefined
          ? exportCanvas.toDataURL(mime, quality)
          : exportCanvas.toDataURL(mime);
      const a = document.createElement("a");
      a.href = data;
      a.download = `canvas.${format === "jpeg" ? "jpg" : "png"}`;
      a.click();
    },
    listeners,
  );

  // image loading
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  listen(
    imageLoader,
    "change",
    (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          editor.saveState();
          editor.ctx.drawImage(
            img,
            0,
            0,
            editor.canvas.width,
            editor.canvas.height,
          );
          updateHistoryButtons();
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

  // layer selection
  listen(
    layerSelect,
    "change",
    () => {
      const idx = parseInt(layerSelect!.value, 10);
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
    if (layerSelect) layerSelect.value = String(index);
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
