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
  const constructorToId = new Map<new () => Tool, string>();
  const editorToolConstructors = new Map<Editor, new () => Tool>();
  let activeToolCtor: new () => Tool = PencilTool;
  let activeLayerIndex = 0;
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

  const updateLayerInteractivity = () => {
    canvases.forEach((canvas, index) => {
      canvas.style.pointerEvents = index === activeLayerIndex ? "auto" : "none";
    });
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
  const jpegQualityGroup =
    document.getElementById("jpegQualityGroup") as HTMLDivElement | null;
  const jpegQuality =
    document.getElementById("jpegQuality") as HTMLInputElement | null;
  const jpegQualityValue = document.getElementById(
    "jpegQualityValue",
  ) as HTMLOutputElement | null;
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
  if (!jpegQualityGroup || !jpegQuality || !jpegQualityValue) {
    throw new Error("Missing JPEG quality controls");
  }

  type ExportFormat = {
    id: string;
    label: string;
    mime: string;
    extension: string;
    supportsQuality?: boolean;
  };

  const detectCanvasFormatSupport = (mime: string): boolean => {
    const testCanvas = document.createElement("canvas");
    try {
      return testCanvas.toDataURL(mime).startsWith(`data:${mime}`);
    } catch {
      return false;
    }
  };

  const baseFormats: ExportFormat[] = [
    { id: "png", label: "PNG", mime: "image/png", extension: "png" },
    {
      id: "jpeg",
      label: "JPEG",
      mime: "image/jpeg",
      extension: "jpg",
      supportsQuality: true,
    },
  ];
  const optionalFormats: ExportFormat[] = [
    { id: "webp", label: "WebP", mime: "image/webp", extension: "webp" },
    { id: "avif", label: "AVIF", mime: "image/avif", extension: "avif" },
  ];

  const formats: ExportFormat[] = baseFormats.slice();
  optionalFormats.forEach((format) => {
    if (detectCanvasFormatSupport(format.mime)) {
      formats.push(format);
    }
  });

  const formatConfigs = new Map<string, ExportFormat>();
  formatSelect.innerHTML = "";
  formats.forEach((format) => {
    const option = document.createElement("option");
    option.value = format.id;
    option.textContent = format.label;
    formatSelect.appendChild(option);
    formatConfigs.set(format.id, format);
  });
  if (!formatConfigs.has(formatSelect.value)) {
    formatSelect.value = formats[0]?.id ?? "png";
  }

  const listeners: Array<() => void> = [];

  const defaultJpegQuality = 90;
  const clampQuality = (value: number): number => {
    const min = Number.parseFloat(jpegQuality.min || "0");
    const max = Number.parseFloat(jpegQuality.max || "100");
    const safeValue = Number.isNaN(value)
      ? defaultJpegQuality
      : Math.round(value);
    return Math.min(Math.max(safeValue, min), max);
  };

  const readStoredJpegQuality = (): number => {
    try {
      const stored = window.localStorage.getItem("editor.jpegQuality");
      if (!stored) return defaultJpegQuality;
      const parsed = Number.parseInt(stored, 10);
      if (Number.isNaN(parsed)) return defaultJpegQuality;
      return clampQuality(parsed);
    } catch {
      return defaultJpegQuality;
    }
  };

  const writeStoredJpegQuality = (value: number) => {
    try {
      window.localStorage.setItem("editor.jpegQuality", String(value));
    } catch {
      /* ignore storage failures */
    }
  };

  const updateQualityDisplay = (percent: number) => {
    jpegQualityValue.textContent = `${Math.round(percent)}%`;
  };

  const updateFormatDependentControls = () => {
    jpegQualityGroup.hidden = formatSelect.value !== "jpeg";
  };

  const initialQuality = readStoredJpegQuality();
  jpegQuality.value = String(initialQuality);
  updateQualityDisplay(initialQuality);
  updateFormatDependentControls();

  listen<Event>(formatSelect, "change", () => {
    updateFormatDependentControls();
  }, listeners);

  listen<Event>(jpegQuality, "input", () => {
    const quality = clampQuality(Number.parseFloat(jpegQuality.value));
    jpegQuality.value = String(quality);
    updateQualityDisplay(quality);
    writeStoredJpegQuality(quality);
  }, listeners);

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
      const ctor = tool.constructor as new () => Tool;
      editorToolConstructors.set(e, ctor);
      activeToolCtor = ctor;
      setActiveButton(buttonForTool(tool));
    };
  });

  // active editor defaults to the first successfully created editor
  editor = editors[0];

  // default tool
  editor.setTool(new PencilTool());
  editorToolConstructors.set(editor, PencilTool);
  updateLayerInteractivity();

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
      const fallbackFormat = formatConfigs.get("png");
      const selectedFormat =
        formatConfigs.get(formatSelect.value) ?? fallbackFormat;
      if (!selectedFormat) {
        throw new Error("No export formats available");
      }
      let mime = selectedFormat.mime;
      let extension = selectedFormat.extension;
      const qualityPercent = selectedFormat.supportsQuality
        ? clampQuality(Number.parseFloat(jpegQuality.value))
        : undefined;
      const quality =
        qualityPercent !== undefined ? qualityPercent / 100 : undefined;

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

      const ensureDataUrl = (targetMime: string, targetQuality?: number) => {
        return targetQuality !== undefined
          ? exportCanvas.toDataURL(targetMime, targetQuality)
          : exportCanvas.toDataURL(targetMime);
      };

      let data = ensureDataUrl(mime, quality);
      if (!data.startsWith(`data:${mime}`)) {
        const fallback = ensureDataUrl("image/png");
        if (!fallbackFormat) {
          throw new Error("PNG format is required for fallback");
        }
        data = fallback;
        mime = fallbackFormat.mime;
        extension = fallbackFormat.extension;
        formatSelect.value = fallbackFormat.id;
        updateFormatDependentControls();
      }
      const a = document.createElement("a");
      a.href = data;
      a.download = `canvas.${extension}`;
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
    activeLayerIndex = index;
    editor = editors[index];
    handle.editor = editor;
    shortcuts.switchEditor(editor);
    updateLayerInteractivity();
    const ToolCtor = editorToolConstructors.get(editor) ?? activeToolCtor;
    editor.setTool(new ToolCtor());
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
  recordColor(colorPicker.value);
  updateHistoryButtons();
  return handle;
}
