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

export interface LayerState {
  editor: Editor;
  canvas: HTMLCanvasElement;
  opacity: number;
  blendMode: GlobalCompositeOperation;
}

const BLEND_MODE_OPTIONS: Array<{
  value: GlobalCompositeOperation;
  label: string;
}> = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
];

export interface EditorHandle {
  editor: Editor;
  editors: Editor[];
  layers: LayerState[];
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
  const colorHistory = document.getElementById(
    "colorHistory",
  ) as HTMLDivElement | null;
  const container = document.getElementById("canvasContainer");
  let previewCanvas: HTMLCanvasElement | null = null;
  let previewCtx: CanvasRenderingContext2D | null = null;
  if (container) {
    previewCanvas = container.querySelector(
      "canvas[data-role=preview]",
    ) as HTMLCanvasElement | null;
    if (!previewCanvas) {
      previewCanvas = document.createElement("canvas");
      previewCanvas.dataset.role = "preview";
      previewCanvas.style.position = "absolute";
      previewCanvas.style.top = "0";
      previewCanvas.style.left = "0";
      previewCanvas.style.width = "100%";
      previewCanvas.style.height = "100%";
      previewCanvas.style.pointerEvents = "none";
      container.insertBefore(previewCanvas, container.firstChild);
    }
    previewCtx = previewCanvas.getContext("2d");
  }

  const layers: LayerState[] = canvases.map((canvas) => ({
    editor: null as unknown as Editor,
    canvas,
    opacity: 1,
    blendMode: "source-over",
  }));

  const renderPreview = () => {
    if (!previewCanvas || !previewCtx || layers.length === 0) return;
    const width = canvases[0].width;
    const height = canvases[0].height;
    if (!width || !height) return;
    if (previewCanvas.width !== width) previewCanvas.width = width;
    if (previewCanvas.height !== height) previewCanvas.height = height;
    compositeLayers(previewCtx, width, height, layers);
  };

  const requestFrame: (callback: FrameRequestCallback) => number =
    typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame.bind(window)
      : (cb: FrameRequestCallback) =>
          window.setTimeout(
            () => cb(typeof performance !== "undefined" ? performance.now() : Date.now()),
            16,
          );

  const schedulePreview = (() => {
    let raf = 0;
    return () => {
      if (!previewCtx) return;
      if (raf) return;
      raf = requestFrame(() => {
        raf = 0;
        renderPreview();
      });
    };
  })();

  if (previewCtx) {
    canvases.forEach((canvas) => {
      canvas.style.opacity = "0";
    });
  }

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

  const listeners: Array<() => void> = [];

  if (layerSelect) {
    layerSelect.innerHTML = "";
  }

  canvases.forEach((canvas, i) => {
    const canvasId = canvas.id || `layer${i + 1}`;
    const name = canvas.id || `Layer ${i + 1}`;
    const layer = layers[i];

    if (layerSelect) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = name;
      layerSelect.appendChild(opt);
    }

    const opacityId = `${canvasId}Opacity`;
    let opacityInput = document.getElementById(opacityId) as
      | HTMLInputElement
      | null;
    if (!opacityInput) {
      const group = document.createElement("div");
      group.className = "group";

      const label = document.createElement("label");
      label.htmlFor = opacityId;
      label.textContent = `${name} Opacity`;

      opacityInput = document.createElement("input");
      opacityInput.id = opacityId;
      opacityInput.type = "number";
      opacityInput.min = "0";
      opacityInput.max = "100";
      opacityInput.value = "100";

      group.appendChild(label);
      group.appendChild(opacityInput);
      toolbar.appendChild(group);
    }

    if (opacityInput) {
      const applyOpacity = () => {
        const value = parseFloat(opacityInput!.value);
        const normalized = isNaN(value) ? 1 : Math.max(0, Math.min(1, value / 100));
        layer.opacity = normalized;
        schedulePreview();
      };
      applyOpacity();
      listen(opacityInput, "input", applyOpacity, listeners);
    }

    const blendId = `${canvasId}BlendMode`;
    let blendSelect = document.getElementById(blendId) as
      | HTMLSelectElement
      | null;
    if (!blendSelect) {
      const group = document.createElement("div");
      group.className = "group";

      const label = document.createElement("label");
      label.htmlFor = blendId;
      label.textContent = `${name} Blend`;

      blendSelect = document.createElement("select");
      blendSelect.id = blendId;
      BLEND_MODE_OPTIONS.forEach(({ value, label: text }) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = text;
        blendSelect!.appendChild(opt);
      });

      group.appendChild(label);
      group.appendChild(blendSelect);
      toolbar.appendChild(group);
    }

    if (blendSelect) {
      if (!blendSelect.value) {
        blendSelect.value = "source-over";
      }
      const applyBlend = () => {
        layer.blendMode = (blendSelect!.value as GlobalCompositeOperation) || "source-over";
        schedulePreview();
      };
      applyBlend();
      listen(blendSelect, "change", applyBlend, listeners);
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
  canvases.forEach((c, index) => {
    try {
      const e = new Editor(
        c,
        colorPicker,
        lineWidth,
        fillMode,
        () => {
          updateHistoryButtons();
          schedulePreview();
        },
        fontFamily ?? undefined,
        fontSize ?? undefined,
      );
      editors.push(e);
      layers[index].editor = e;
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
      const format =
        formatSelect.value.toLowerCase() === "jpeg" ? "jpeg" : "png";
      const mime = format === "jpeg" ? "image/jpeg" : "image/png";
      const quality = format === "jpeg" ? 0.9 : undefined;

      let exportCanvas: HTMLCanvasElement;
      const baseLayer = layers[0];
      const needsComposite =
        layers.length > 1 ||
        !baseLayer ||
        baseLayer.opacity !== 1 ||
        baseLayer.blendMode !== "source-over";
      if (needsComposite) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvases[0].width;
        tempCanvas.height = canvases[0].height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          compositeLayers(tempCtx, tempCanvas.width, tempCanvas.height, layers);
          exportCanvas = tempCanvas;
        } else {
          exportCanvas = editor.canvas;
        }
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
    schedulePreview();
  }

  const handle: EditorHandle = {
    editor,
    editors,
    layers,
    activateLayer,
    destroy() {
      listeners.forEach((fn) => fn());
      shortcuts.destroy();
      editors.forEach((e) => e.destroy());
    },
  };
  recordColor(colorPicker.value);
  updateHistoryButtons();
  schedulePreview();
  return handle;
}

function compositeLayers(
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layers: LayerState[],
) {
  const canComposite = typeof targetCtx.globalCompositeOperation === "string";

  if (canComposite) {
    const originalOp = targetCtx.globalCompositeOperation;
    const originalAlpha = targetCtx.globalAlpha ?? 1;
    if (typeof targetCtx.clearRect === "function") {
      targetCtx.clearRect(0, 0, width, height);
    }
    targetCtx.globalCompositeOperation = "source-over";
    targetCtx.globalAlpha = 1;
    layers.forEach((layer) => {
      targetCtx.globalAlpha = layer.opacity;
      targetCtx.globalCompositeOperation = layer.blendMode;
      targetCtx.drawImage(layer.canvas, 0, 0);
    });
    targetCtx.globalCompositeOperation = originalOp;
    targetCtx.globalAlpha = originalAlpha;
    return;
  }

  if (typeof targetCtx.putImageData !== "function") {
    layers.forEach((layer) => {
      targetCtx.drawImage(layer.canvas, 0, 0);
    });
    return;
  }

  const output = new Uint8ClampedArray(width * height * 4);
  layers.forEach((layer) => {
    if (!layer.opacity) return;
    const ctx = layer.editor?.ctx ?? layer.canvas.getContext("2d");
    if (!ctx?.getImageData) return;
    const source = ctx.getImageData(0, 0, width, height);
    cpuComposite(output, source.data, layer.opacity, layer.blendMode);
  });

  const imageData = new ImageData(output, width, height);
  targetCtx.putImageData(imageData, 0, 0);
}

function cpuComposite(
  dest: Uint8ClampedArray,
  src: Uint8ClampedArray,
  opacity: number,
  mode: GlobalCompositeOperation,
) {
  if (opacity <= 0) return;
  const blend = getBlendFunction(mode);
  for (let i = 0; i < dest.length; i += 4) {
    const srcAlpha = (src[i + 3] / 255) * opacity;
    if (srcAlpha <= 0) continue;
    const dstAlpha = dest[i + 3] / 255;
    const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

    const srcR = src[i] / 255;
    const srcG = src[i + 1] / 255;
    const srcB = src[i + 2] / 255;
    const dstR = dest[i] / 255;
    const dstG = dest[i + 1] / 255;
    const dstB = dest[i + 2] / 255;

    const blendedR = blend(srcR, dstR);
    const blendedG = blend(srcG, dstG);
    const blendedB = blend(srcB, dstB);

    if (outAlpha <= 0) {
      dest[i] = 0;
      dest[i + 1] = 0;
      dest[i + 2] = 0;
      dest[i + 3] = 0;
      continue;
    }

    dest[i] = Math.round(
      clamp01(
        (blendedR * srcAlpha + dstR * dstAlpha * (1 - srcAlpha)) / outAlpha,
      ) * 255,
    );
    dest[i + 1] = Math.round(
      clamp01(
        (blendedG * srcAlpha + dstG * dstAlpha * (1 - srcAlpha)) / outAlpha,
      ) * 255,
    );
    dest[i + 2] = Math.round(
      clamp01(
        (blendedB * srcAlpha + dstB * dstAlpha * (1 - srcAlpha)) / outAlpha,
      ) * 255,
    );
    dest[i + 3] = Math.round(clamp01(outAlpha) * 255);
  }
}

type BlendFn = (src: number, dst: number) => number;

function getBlendFunction(mode: GlobalCompositeOperation): BlendFn {
  switch (mode) {
    case "multiply":
      return (src, dst) => src * dst;
    case "screen":
      return (src, dst) => 1 - (1 - src) * (1 - dst);
    case "overlay":
      return (src, dst) =>
        dst <= 0.5 ? 2 * src * dst : 1 - 2 * (1 - src) * (1 - dst);
    case "darken":
      return (src, dst) => Math.min(src, dst);
    case "lighten":
      return (src, dst) => Math.max(src, dst);
    default:
      return (src) => src;
  }
}

function clamp01(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}
