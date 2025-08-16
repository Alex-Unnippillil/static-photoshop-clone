import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import type { Tool } from "./tools/Tool";

export interface EditorHandle {
  editor: Editor;
  activateLayer: (index: number) => void;
  destroy: () => void;
}

/**
 * Initialize the editor application.
 *
 * The editor supports multiple layers – each canvas element on the page
 * represents a separate layer with its own {@link Editor} instance and
 * independent undo/redo stacks. The returned handle exposes the currently
 * active editor and allows switching layers programmatically.
 */
export function initEditor(): EditorHandle {
  const canvases = Array.from(
    document.querySelectorAll<HTMLCanvasElement>("canvas"),
  );
  if (!canvases.length) {
    throw new Error("No canvas elements found");
  }

  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as
    | HTMLInputElement
    | null;

  // Current active editor index
  let active = 0;

  // Editors for each canvas/layer
  const editors = canvases.map(
    (c) =>
      new Editor(c, colorPicker, lineWidth, fillMode, updateUndoRedoButtons),
  );

  // Active editor reference
  let editor = editors[active];

  // Keyboard shortcuts bound to the active editor
  let shortcuts = new Shortcuts(editor);

  function updateUndoRedoButtons() {
    if (undoBtn) undoBtn.disabled = !editor.canUndo;
    if (redoBtn) redoBtn.disabled = !editor.canRedo;
  }

  // -- Toolbar bindings ----------------------------------------------------
  const toolDefs: Array<[string, () => Tool]> = [
    ["pencil", () => new PencilTool()],
    ["eraser", () => new EraserTool()],
    ["rectangle", () => new RectangleTool()],
    ["line", () => new LineTool()],
    ["circle", () => new CircleTool()],
    ["text", () => new TextTool()],
  ];

  const listeners: Array<() => void> = [];

  toolDefs.forEach(([id, factory]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const handler = () => editor.setTool(factory());
    btn.addEventListener("click", handler);
    listeners.push(() => btn.removeEventListener("click", handler));
  });

  if (undoBtn) {
    const handler = () => {
      editor.undo();
      updateUndoRedoButtons();
    };
    undoBtn.addEventListener("click", handler);
    listeners.push(() => undoBtn.removeEventListener("click", handler));
  }

  if (redoBtn) {
    const handler = () => {
      editor.redo();
      updateUndoRedoButtons();
    };
    redoBtn.addEventListener("click", handler);
    listeners.push(() => redoBtn.removeEventListener("click", handler));
  }

  if (saveBtn) {
    const handler = () => {
      const data = editor.canvas.toDataURL("image/png");
      const anchor = document.createElement("a");
      anchor.href = data;
      anchor.download = "canvas.png";
      anchor.click();
    };
    saveBtn.addEventListener("click", handler);
    listeners.push(() => saveBtn.removeEventListener("click", handler));
  }

  if (imageLoader) {
    const handler = () => {
      const file = imageLoader.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          editor.ctx.drawImage(
            img,
            0,
            0,
            editor.canvas.width,
            editor.canvas.height,
          );
          updateUndoRedoButtons();
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    };
    imageLoader.addEventListener("change", handler);
    listeners.push(() => imageLoader.removeEventListener("change", handler));
  }

  // Initial button state
  updateUndoRedoButtons();

  const handle: EditorHandle = {
    editor,
    activateLayer(index: number) {
      if (index < 0 || index >= editors.length || index === active) return;
      shortcuts.destroy();
      active = index;
      editor = editors[active];
      this.editor = editor;
      shortcuts = new Shortcuts(editor);
      updateUndoRedoButtons();
    },
    destroy() {
      shortcuts.destroy();
      editors.forEach((e) => e.destroy());
      listeners.forEach((off) => off());
    },
  };

  return handle;
}

