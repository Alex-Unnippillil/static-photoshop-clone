import type { Editor } from "../core/Editor.js";
import { listen, optionalElement, type Cleanup } from "./domHelpers.js";

export interface HistoryControlsInput {
  getEditor: () => Editor;
  cleanups: Cleanup[];
}

export interface HistoryControlsOutput {
  updateHistoryButtons: () => void;
  destroy: Cleanup;
}

export function initHistoryControls({
  getEditor,
  cleanups,
}: HistoryControlsInput): HistoryControlsOutput {
  const undoBtn = optionalElement<HTMLButtonElement>("undo");
  const redoBtn = optionalElement<HTMLButtonElement>("redo");

  const updateHistoryButtons = () => {
    const editor = getEditor();
    if (undoBtn) undoBtn.disabled = !editor.canUndo;
    if (redoBtn) redoBtn.disabled = !editor.canRedo;
  };

  listen(undoBtn, "click", () => {
    getEditor().undo();
    updateHistoryButtons();
  }, cleanups);

  listen(redoBtn, "click", () => {
    getEditor().redo();
    updateHistoryButtons();
  }, cleanups);

  return { updateHistoryButtons, destroy: () => {} };
}
