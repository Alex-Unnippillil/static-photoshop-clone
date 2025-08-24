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
  let canvases = Array.from(
    document.querySelectorAll<HTMLCanvasElement>("canvas"),
  );
  const canvasContainer = document.getElementById(
    "canvasContainer",
  ) as HTMLElement | null;
  const addLayerBtn = document.getElementById("addLayer") as
    | HTMLButtonElement
    | null;
  const deleteLayerBtn = document.getElementById("deleteLayer") as
    | HTMLButtonElement
    | null;
  let layerCounter = canvases.length;

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
  const constructorToId = new Map<new () => Tool, string>();
  Object.entries(toolConstructors).forEach(([id, Ctor]) => {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    if (!btn) {
      throw new Error(`Missing #${id} button`);
    }
    toolButtons[id] = btn;
    constructorToId.set(Ctor, id);
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
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const listeners: Array<() => void> = [];

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
    c.dataset.name = c.id || `Layer ${i + 1}`;
  });
  canvases.slice(1).forEach((c) => createOpacityControl(c));
  refreshLayerOptions();

  let editor: Editor; // set after editors created

  const updateHistoryButtons = () => {
    if (undoBtn) undoBtn.disabled = !editor?.canUndo;
    if (redoBtn) redoBtn.disabled = !editor?.canRedo;
  };

  const editors: Editor[] = [];
  canvases.forEach((c) => {
    try {
      const e = new Editor(
        c,
        colorPicker,
        lineWidth,
        fillMode,
        () => {
          updateHistoryButtons();
        },
        fontFamily ?? undefined,
        fontSize ?? undefined,
      );
      editors.push(e);
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
          if (imageLoader) imageLoader.value = "";
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    listeners,
  );

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

  listen(addLayerBtn, "click", () => addLayer(), listeners);
  listen(
    deleteLayerBtn,
    "click",
    () => {
      const idx = parseInt(layerSelect?.value ?? "0", 10);
      deleteLayer(idx);
    },
    listeners,
  );

  let draggedIndex = -1;
  listen(
    layerSelect,
    "dragstart",
    (e: Event) => {
      const opt = e.target as HTMLOptionElement | null;
      if (opt) draggedIndex = parseInt(opt.value, 10);
    },
    listeners,
  );
  listen(
    layerSelect,
    "dragover",
    (e: Event) => {
      e.preventDefault();
    },
    listeners,
  );
  listen(
    layerSelect,
    "drop",
    (e: Event) => {
      e.preventDefault();
      const opt = e.target as HTMLOptionElement | null;
      if (opt && draggedIndex !== -1) {
        const target = parseInt(opt.value, 10);
        reorderLayers(draggedIndex, target);
        draggedIndex = -1;
      }
    },
    listeners,
  );

  listen(
    layerSelect,
    "dblclick",
    (e: Event) => {
      const opt = e.target as HTMLOptionElement | null;
      if (!opt) return;
      const idx = parseInt(opt.value, 10);
      const newName = prompt(
        "Layer name",
        canvases[idx].dataset.name || opt.textContent || "",
      );
      if (newName) {
        canvases[idx].dataset.name = newName;
        refreshLayerOptions();
        layerSelect!.value = String(idx);
      }
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

  function refreshLayerOptions() {
    if (!layerSelect) return;
    layerSelect.innerHTML = "";
    canvases.forEach((cv, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = cv.dataset.name || cv.id || `Layer ${i + 1}`;
      opt.draggable = true;
      layerSelect.appendChild(opt);
    });
  }

  function createOpacityControl(c: HTMLCanvasElement) {
    let input = document.getElementById(`${c.id}Opacity`) as HTMLInputElement | null;
    if (!input) {
      const group = document.createElement("div");
      group.className = "group";
      const label = document.createElement("label");
      label.htmlFor = `${c.id}Opacity`;
      label.textContent = `${c.dataset.name ?? c.id} Opacity`;
      input = document.createElement("input");
      input.id = `${c.id}Opacity`;
      input.type = "number";
      input.min = "0";
      input.max = "100";
      input.value = "100";
      group.appendChild(label);
      group.appendChild(input);
      toolbar.appendChild(group);
    }
    listen(
      input,
      "input",
      () => {
        const value = parseFloat(input!.value);
        c.style.opacity = isNaN(value) ? "1" : String(value / 100);
      },
      listeners,
    );
  }

  function refreshOpacityControls() {
    canvases.forEach((c, i) => {
      const input = document.getElementById(`${c.id}Opacity`);
      if (i === 0) {
        input?.parentElement?.remove();
      } else if (!input) {
        createOpacityControl(c);
      }
    });
  }

  function addLayer() {
    if (!canvasContainer) return;
    const base = canvases[0];
    const canvas = document.createElement("canvas");
    canvas.width = base.width;
    canvas.height = base.height;
    canvas.id = `layer${++layerCounter}`;
    canvas.dataset.name = `Layer ${layerCounter}`;
    canvasContainer.appendChild(canvas);
    canvases.push(canvas);
    try {
      const e = new Editor(
        canvas,
        colorPicker,
        lineWidth,
        fillMode,
        () => {
          updateHistoryButtons();
        },
        fontFamily ?? undefined,
        fontSize ?? undefined,
      );
      editors.push(e);
    } catch {
      /* skip if no context */
    }
    createOpacityControl(canvas);
    refreshLayerOptions();
    activateLayer(canvases.length - 1);
  }

  function deleteLayer(index: number) {
    if (canvases.length <= 1) return;
    const canvas = canvases.splice(index, 1)[0];
    canvas.remove();
    const ed = editors.splice(index, 1)[0];
    ed.destroy();
    document.getElementById(`${canvas.id}Opacity`)?.parentElement?.remove();
    if (layerSelect) {
      layerSelect.remove(index);
      Array.from(layerSelect.options).forEach((o, i) => (o.value = String(i)));
    }
    refreshOpacityControls();
    activateLayer(Math.max(0, index - 1));
  }

  function reorderLayers(from: number, to: number) {
    if (from === to) return;
    const canvas = canvases.splice(from, 1)[0];
    canvases.splice(to, 0, canvas);
    const ed = editors.splice(from, 1)[0];
    editors.splice(to, 0, ed);
    if (canvasContainer) {
      const ref = canvasContainer.children[to] || null;
      canvasContainer.insertBefore(canvas, ref);
    }
    if (layerSelect) {
      const opt = layerSelect.options[from];
      const refOpt = layerSelect.options[to] || null;
      layerSelect.removeChild(opt);
      layerSelect.insertBefore(opt, refOpt);
      Array.from(layerSelect.options).forEach((o, i) => (o.value = String(i)));
    }
    refreshOpacityControls();
    activateLayer(parseInt(layerSelect?.value ?? "0", 10));
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
