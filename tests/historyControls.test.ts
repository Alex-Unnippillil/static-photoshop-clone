import { initHistoryControls } from "../src/editor/historyControls.js";

test("history controls wire undo/redo", () => {
  document.body.innerHTML = `<button id='undo'></button><button id='redo'></button>`;
  const editor = { canUndo: true, canRedo: false, undo: jest.fn(), redo: jest.fn() } as any;
  const cleanups: Array<() => void> = [];
  const { updateHistoryButtons } = initHistoryControls({ getEditor: () => editor, cleanups });
  updateHistoryButtons();
  expect((document.getElementById("undo") as HTMLButtonElement).disabled).toBe(false);
  expect((document.getElementById("redo") as HTMLButtonElement).disabled).toBe(true);
  (document.getElementById("undo") as HTMLButtonElement).click();
  expect(editor.undo).toHaveBeenCalled();
});
