import { Editor } from "./core/Editor.js";
import { Shortcuts } from "./core/Shortcuts.js";
import { LayerManager } from "./core/LayerManager.js";
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
  addLayer(name?: string): number;
  removeLayer(index?: number): boolean;
  renameLayer(index: number, name: string): void;
  getLayerNames(): string[];
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
  const constructorToId = new Map<new () => Tool, string>();
  const editorToolConstructors = new Map<Editor, new () => Tool>();
  let activeToolCtor: new () => Tool = PencilTool;
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
  const addLayerBtn = document.getElementById("addLayer") as HTMLButtonElement | null;
  const removeLayerBtn = document.getElementById("removeLayer") as HTMLButtonElement | null;
  const renameLayerBtn = document.getElementById("renameLayer") as HTMLButtonElement | null;
  const toolbar = document.getElementById("toolbar") || document.body;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const formatSelect =
    document.getElementById("formatSelect") as HTMLSelectElement | null;
  const colorHistory = document.getElementById(
    "colorHistory",
  ) as HTMLDivElement | null;

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

  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const listeners: Array<() => void> = [];

  const recentColors: string[] = [];
  const maxRecentColors = 10;
  const renderColorHistory = () => {
    if (!colorHistory) return;
    colorHistory.innerHTML = "";
    recentColors.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch";
      btn.style.backgroundColor = color;
      btn.setAttribute("aria-label", `Select ${color}`);
      btn.addEventListener("click", () => {
        colorPicker.value = color;
        colorPicker.dispatchEvent(new Event("input"));
      });
      colorHistory.appendChild(btn);
    });
  };

  const recordColor = (color: string) => {
    const existing = recentColors.indexOf(color);
    if (existing !== -1) recentColors.splice(existing, 1);
    recentColors.unshift(color);
    if (recentColors.length > maxRecentColors) recentColors.pop();
    renderColorHistory();
  };

  listen(
    colorPicker,
    "input",
    () => {
      recordColor(colorPicker.value);
    },
    listeners,
  );

  const updateHistoryButtons = () => {
    if (undoBtn) undoBtn.disabled = !editor?.canUndo;
    if (redoBtn) redoBtn.disabled = !editor?.canRedo;
  };

  const canvasContainer =
    document.getElementById("canvasContainer") || canvases[0]?.parentElement;
  if (!canvasContainer) {
    throw new Error("Missing canvas container element");
  }

  const layerManager = new LayerManager({
    canvases,
    canvasContainer,
    toolbar,
    layerSelect,
    colorPicker,
    lineWidth,
    fillMode,
    onHistoryChange: () => updateHistoryButtons(),
    fontFamily: fontFamily ?? undefined,
    fontSize: fontSize ?? undefined,
  });

  if (layerManager.length === 0) {
    throw new Error(
      "initEditor() requires at least one <canvas> element with a 2D context",
    );
  }

  const editors = layerManager.editors;
  let editor: Editor = layerManager.activeEditor;

  editors.forEach((e) => {
    const original = e.setTool.bind(e);
    e.setTool = (tool: Tool) => {
      original(tool);
      const ctor = tool.constructor as new () => Tool;
      editorToolConstructors.set(e, ctor);
      activeToolCtor = ctor;
      setActiveButton(buttonForTool(tool));
    };
  });

  // active editor defaults to the first successfully created editor
  // default tool
  editor.setTool(new PencilTool());
  editorToolConstructors.set(editor, PencilTool);
  layerManager.activateLayer(0);

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

  const updateLayerControls = () => {
    if (removeLayerBtn) {
      removeLayerBtn.disabled = layerManager.length <= 1;
    }
    if (renameLayerBtn) {
      renameLayerBtn.disabled = layerManager.length === 0;
    }
  };

  const activateLayer = (index: number) => {
    if (!layerManager.activateLayer(index)) return;
    editor = layerManager.activeEditor;
    handle.editor = editor;
    shortcuts.switchEditor(editor);
    const ToolCtor = editorToolConstructors.get(editor) ?? activeToolCtor;
    editor.setTool(new ToolCtor());
    updateHistoryButtons();
    if (layerSelect) layerSelect.value = String(index);
    updateLayerControls();
  };

  const addLayer = (name?: string) => {
    const index = layerManager.createLayer(name);
    const newEditor = layerManager.activeEditor;
    editorToolConstructors.set(newEditor, activeToolCtor);
    handle.editors = layerManager.editors;
    activateLayer(index);
    return index;
  };

  const removeLayer = (index = layerManager.activeLayerIndex) => {
    const removed = layerManager.removeLayer(index);
    if (!removed) return false;
    handle.editors = layerManager.editors;
    activateLayer(layerManager.activeLayerIndex);
    return true;
  };

  const renameLayer = (index: number, newName: string) => {
    layerManager.renameLayer(index, newName);
    updateLayerControls();
  };

  const promptRename = () => {
    const idx = layerManager.activeLayerIndex;
    const currentName = layerManager.layerNames[idx];
    const next = window.prompt("Layer name", currentName);
    if (!next || next.trim() === "") return;
    renameLayer(idx, next.trim());
  };

  listen(addLayerBtn, "click", () => addLayer(), listeners);
  listen(removeLayerBtn, "click", () => removeLayer(), listeners);
  listen(renameLayerBtn, "click", () => promptRename(), listeners);

  const isTextInput = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
      target.isContentEditable ||
      tag === "input" ||
      tag === "textarea" ||
      tag === "select"
    );
  };

  const shortcutHandler = (event: KeyboardEvent) => {
    if (isTextInput(event.target)) return;
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    if (!ctrl || !event.shiftKey) return;

    if (key === "n") {
      event.preventDefault();
      addLayer();
    } else if (key === "d") {
      event.preventDefault();
      removeLayer();
    } else if (key === "r") {
      event.preventDefault();
      promptRename();
    }
  };

  document.addEventListener("keydown", shortcutHandler);
  listeners.push(() => document.removeEventListener("keydown", shortcutHandler));

  updateLayerControls();

  const handle: EditorHandle = {
    editor,
    editors,
    activateLayer,
    addLayer,
    removeLayer,
    renameLayer,
    getLayerNames: () => layerManager.layerNames.slice(),
    destroy() {
      listeners.forEach((fn) => fn());
      shortcuts.destroy();
      layerManager.destroy();
    },
  };
  recordColor(colorPicker.value);
  updateHistoryButtons();
  return handle;
}
