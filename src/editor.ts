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
  const colorHistory = document.getElementById(
    "colorHistory",
  ) as HTMLDivElement | null;
  const transformScale = document.getElementById(
    "transformScale",
  ) as HTMLSpanElement | null;
  const transformRotation = document.getElementById(
    "transformRotation",
  ) as HTMLSpanElement | null;
  const resetTransformBtn = document.getElementById(
    "resetTransform",
  ) as HTMLButtonElement | null;
  const commitTransformBtn = document.getElementById(
    "commitTransform",
  ) as HTMLButtonElement | null;
  const flipHorizontalBtn = document.getElementById(
    "flipHorizontal",
  ) as HTMLButtonElement | null;
  const flipVerticalBtn = document.getElementById(
    "flipVertical",
  ) as HTMLButtonElement | null;
  const canvasContainer = document.getElementById(
    "canvasContainer",
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
  type TransformHandle =
    | "n"
    | "ne"
    | "e"
    | "se"
    | "s"
    | "sw"
    | "w"
    | "nw"
    | "rotate";

  interface TransformState {
    scaleX: number;
    scaleY: number;
    rotation: number;
  }

  interface LayerTransformState {
    snapshot: HTMLCanvasElement | null;
    transform: TransformState;
  }

  interface TransformSession {
    canvas: HTMLCanvasElement;
    handle: TransformHandle;
    pointerId: number;
    center: { x: number; y: number };
    initialVector: { x: number; y: number };
    initialTransform: TransformState;
    startAngle?: number;
    previousUserSelect: string;
  }

  const identityTransform = (): TransformState => ({
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  });

  const MIN_SCALE = 0.01;

  const overlayContainer: HTMLElement =
    canvasContainer ?? (canvases[0]?.parentElement ?? document.body);

  const createElementSafe = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
  ): HTMLElementTagNameMap[K] => {
    const el = document.createElement(tag) as HTMLElementTagNameMap[K];
    const needsFallback =
      typeof (el as unknown as { appendChild?: unknown }).appendChild !==
        "function" ||
      (tag === "canvas" &&
        typeof (el as unknown as HTMLCanvasElement).getContext !== "function");
    if (needsFallback) {
      return document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        tag,
      ) as HTMLElementTagNameMap[K];
    }
    return el;
  };

  const transformOverlay = createElementSafe("div");
  transformOverlay.id = "transformOverlay";
  const transformBox = createElementSafe("div");
  transformBox.className = "transform-box";
  transformOverlay.appendChild(transformBox);
  const handleTypes: TransformHandle[] = [
    "n",
    "ne",
    "e",
    "se",
    "s",
    "sw",
    "w",
    "nw",
    "rotate",
  ];
  const transformHandles: HTMLElement[] = [];
  handleTypes.forEach((handle) => {
    const handleEl = createElementSafe("div");
    handleEl.className = "transform-handle";
    handleEl.dataset.handle = handle;
    transformBox.appendChild(handleEl);
    transformHandles.push(handleEl);
  });
  overlayContainer.appendChild(transformOverlay);

  const canvasToEditor = new Map<HTMLCanvasElement, Editor>();
  const transformStates = new Map<HTMLCanvasElement, LayerTransformState>();
  let transformSession: TransformSession | null = null;

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

  const getTransformState = (
    canvas: HTMLCanvasElement,
  ): LayerTransformState => {
    let state = transformStates.get(canvas);
    if (!state) {
      state = { snapshot: null, transform: identityTransform() };
      transformStates.set(canvas, state);
    }
    return state;
  };

  const sanitizeScale = (value: number) =>
    value >= 0 ? Math.max(value, MIN_SCALE) : Math.min(value, -MIN_SCALE);

  const normalizeRotation = (value: number) => {
    let normalized = value % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized <= -180) normalized += 360;
    return normalized;
  };

  const isIdentityTransform = (transform: TransformState) =>
    Math.abs(transform.scaleX - 1) < 1e-3 &&
    Math.abs(transform.scaleY - 1) < 1e-3 &&
    Math.abs(normalizeRotation(transform.rotation)) < 1e-1;

  const formatPercent = (value: number) => {
    const magnitude = Math.abs(value) * 100;
    const formatted =
      magnitude >= 1000 ? magnitude.toFixed(0) : magnitude.toFixed(1);
    const trimmed = formatted.replace(/\.0$/, "");
    return `${value < 0 ? "-" : ""}${trimmed}%`;
  };

  const formatAngle = (value: number) => {
    const normalized = normalizeRotation(value);
    const formatted =
      Math.abs(normalized) >= 1000
        ? normalized.toFixed(0)
        : normalized.toFixed(1);
    return `${formatted.replace(/\.0$/, "")}°`;
  };

  const updateTransformReadout = (state: TransformState) => {
    if (transformScale) {
      transformScale.textContent = `Scale: ${formatPercent(
        state.scaleX,
      )} × ${formatPercent(state.scaleY)}`;
    }
    if (transformRotation) {
      transformRotation.textContent = `Rotation: ${formatAngle(
        state.rotation,
      )}`;
    }
  };

  const updateTransformButtonsState = (state: LayerTransformState) => {
    const pending = Boolean(state.snapshot) && !isIdentityTransform(state.transform);
    if (resetTransformBtn) resetTransformBtn.disabled = !pending;
    if (commitTransformBtn) commitTransformBtn.disabled = !pending;
  };

  const updateTransformUI = () => {
    if (!editor) return;
    const state = getTransformState(editor.canvas);
    updateTransformReadout(state.transform);
    updateTransformButtonsState(state);
  };

  const ensureSnapshotForCanvas = (canvas: HTMLCanvasElement) => {
    const state = getTransformState(canvas);
    if (!state.snapshot) {
      const snap = createElementSafe("canvas");
      snap.width = canvas.width;
      snap.height = canvas.height;
      const snapCtx = snap.getContext("2d");
      if (!snapCtx) return null;
      snapCtx.drawImage(canvas, 0, 0);
      state.snapshot = snap;
      state.transform = identityTransform();
    }
    return state.snapshot;
  };

  const restoreFromSnapshot = (
    canvas: HTMLCanvasElement,
    snapshot: HTMLCanvasElement,
  ) => {
    const targetEditor = canvasToEditor.get(canvas);
    if (!targetEditor) return;
    const { ctx } = targetEditor;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snapshot, 0, 0);
    ctx.restore();
  };

  const applyTransformPreview = (canvas: HTMLCanvasElement) => {
    const state = getTransformState(canvas);
    const snapshot = state.snapshot;
    if (!snapshot) return;
    const targetEditor = canvasToEditor.get(canvas);
    if (!targetEditor) return;
    const { ctx } = targetEditor;
    const { scaleX, scaleY, rotation } = state.transform;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(snapshot, 0, 0);
    ctx.restore();
  };

  const updateTransformOverlayBounds = () => {
    if (!editor) return;
    const rect = editor.canvas.getBoundingClientRect();
    const containerRect = overlayContainer.getBoundingClientRect();
    transformBox.style.left = `${rect.left - containerRect.left}px`;
    transformBox.style.top = `${rect.top - containerRect.top}px`;
    transformBox.style.width = `${rect.width}px`;
    transformBox.style.height = `${rect.height}px`;
  };

  const updateTransformFromPointer = (event: PointerEvent) => {
    if (!transformSession) return;
    const { canvas, handle, center, initialVector, initialTransform } =
      transformSession;
    const state = getTransformState(canvas);
    if (!state.snapshot) return;
    const currentVector = {
      x: event.clientX - center.x,
      y: event.clientY - center.y,
    };

    let scaleX = initialTransform.scaleX;
    let scaleY = initialTransform.scaleY;
    let rotation = initialTransform.rotation;

    const computeRatio = (initialValue: number, currentValue: number) => {
      if (Math.abs(initialValue) < 1e-6) return 1;
      const ratio = currentValue / initialValue;
      return ratio;
    };

    switch (handle) {
      case "e":
      case "w": {
        const ratio = computeRatio(initialVector.x, currentVector.x);
        scaleX = sanitizeScale(initialTransform.scaleX * ratio);
        break;
      }
      case "n":
      case "s": {
        const ratio = computeRatio(initialVector.y, currentVector.y);
        scaleY = sanitizeScale(initialTransform.scaleY * ratio);
        break;
      }
      case "ne":
      case "se":
      case "sw":
      case "nw": {
        const ratioX = computeRatio(initialVector.x, currentVector.x);
        const ratioY = computeRatio(initialVector.y, currentVector.y);
        scaleX = sanitizeScale(initialTransform.scaleX * ratioX);
        scaleY = sanitizeScale(initialTransform.scaleY * ratioY);
        break;
      }
      case "rotate": {
        const startAngle = transformSession.startAngle ?? 0;
        const currentAngle = Math.atan2(currentVector.y, currentVector.x);
        const delta = currentAngle - startAngle;
        rotation = initialTransform.rotation + (delta * 180) / Math.PI;
        break;
      }
    }

    const nextTransform: TransformState = {
      scaleX,
      scaleY,
      rotation,
    };
    state.transform = nextTransform;
    applyTransformPreview(canvas);
    updateTransformUI();
  };

  const finishTransformDrag = () => {
    if (!transformSession) return;
    const { canvas, previousUserSelect } = transformSession;
    const state = getTransformState(canvas);
    if (state.snapshot) {
      if (isIdentityTransform(state.transform)) {
        restoreFromSnapshot(canvas, state.snapshot);
        state.snapshot = null;
        state.transform = identityTransform();
      } else {
        applyTransformPreview(canvas);
      }
    }
    document.body.style.userSelect = previousUserSelect;
    transformSession = null;
    updateTransformUI();
  };

  const startTransformDrag = (
    event: PointerEvent,
    handle: TransformHandle,
  ) => {
    if (!editor) return;
    const canvas = editor.canvas;
    if (!ensureSnapshotForCanvas(canvas)) return;
    const boxRect = transformBox.getBoundingClientRect();
    const center = {
      x: boxRect.left + boxRect.width / 2,
      y: boxRect.top + boxRect.height / 2,
    };
    const initialVector = {
      x: event.clientX - center.x,
      y: event.clientY - center.y,
    };
    const state = getTransformState(canvas);
    transformSession = {
      canvas,
      handle,
      pointerId: event.pointerId,
      center,
      initialVector,
      initialTransform: { ...state.transform },
      startAngle:
        handle === "rotate"
          ? Math.atan2(initialVector.y, initialVector.x)
          : undefined,
      previousUserSelect: document.body.style.userSelect,
    };

    const handleMove = (ev: PointerEvent) => {
      if (!transformSession || ev.pointerId !== transformSession.pointerId)
        return;
      updateTransformFromPointer(ev);
    };
    const handleUp = (ev: PointerEvent) => {
      if (!transformSession || ev.pointerId !== transformSession.pointerId)
        return;
      (event.currentTarget as HTMLElement | null)?.releasePointerCapture?.(
        transformSession.pointerId,
      );
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      finishTransformDrag();
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(
      event.pointerId,
    );
    document.body.style.userSelect = "none";
    event.preventDefault();
  };

  transformHandles.forEach((handleEl) => {
    listen<PointerEvent>(
      handleEl,
      "pointerdown",
      (event) => {
        const handleType = handleEl.dataset.handle as TransformHandle | undefined;
        if (!handleType) return;
        startTransformDrag(event, handleType);
      },
      listeners,
    );
  });

  window.addEventListener("resize", updateTransformOverlayBounds);
  listeners.push(() =>
    window.removeEventListener("resize", updateTransformOverlayBounds),
  );

  const commitActiveTransform = () => {
    if (!editor) return;
    const canvas = editor.canvas;
    const state = getTransformState(canvas);
    if (!state.snapshot) return;
    if (isIdentityTransform(state.transform)) {
      state.snapshot = null;
      state.transform = identityTransform();
      updateTransformUI();
      return;
    }

    const snapshot = state.snapshot;
    const finalTransform: TransformState = { ...state.transform };
    restoreFromSnapshot(canvas, snapshot);
    editor.saveState();
    state.snapshot = snapshot;
    state.transform = finalTransform;
    applyTransformPreview(canvas);
    state.snapshot = null;
    state.transform = identityTransform();
    updateHistoryButtons();
    updateTransformUI();
  };

  const resetActiveTransform = () => {
    if (!editor) return;
    const canvas = editor.canvas;
    const state = getTransformState(canvas);
    if (!state.snapshot) return;
    restoreFromSnapshot(canvas, state.snapshot);
    state.snapshot = null;
    state.transform = identityTransform();
    updateTransformUI();
  };

  const flipActiveTransform = (direction: "horizontal" | "vertical") => {
    if (!editor) return;
    const canvas = editor.canvas;
    if (!ensureSnapshotForCanvas(canvas)) return;
    const state = getTransformState(canvas);
    const current = state.transform;
    const next: TransformState = {
      scaleX:
        direction === "horizontal"
          ? sanitizeScale(
              current.scaleX === 0 ? -1 : -current.scaleX,
            )
          : current.scaleX,
      scaleY:
        direction === "vertical"
          ? sanitizeScale(current.scaleY === 0 ? -1 : -current.scaleY)
          : current.scaleY,
      rotation: current.rotation,
    };
    state.transform = next;
    applyTransformPreview(canvas);
    updateTransformUI();
  };

  listen(resetTransformBtn, "click", resetActiveTransform, listeners);
  listen(commitTransformBtn, "click", commitActiveTransform, listeners);
  listen(flipHorizontalBtn, "click", () => flipActiveTransform("horizontal"), listeners);
  listen(flipVerticalBtn, "click", () => flipActiveTransform("vertical"), listeners);

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
      canvasToEditor.set(c, e);
      transformStates.set(c, {
        snapshot: null,
        transform: identityTransform(),
      });
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
    updateTransformOverlayBounds();
    updateTransformUI();
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
  updateTransformOverlayBounds();
  updateTransformUI();
  return handle;
}
