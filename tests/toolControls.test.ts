import { initToolControls } from "../src/editor/toolControls.js";
class A {}
class B {}

test("tool controls activate selected tool", () => {
  document.body.innerHTML = `<button id='pencil'></button><button id='eraser'></button>`;
  const editor = { setTool: jest.fn() } as any;
  initToolControls({ toolConstructors: { pencil: A as any, eraser: B as any }, editorToolConstructors: new Map(), setActiveToolCtor: () => {}, getActiveToolCtor: () => A as any, getEditor: () => editor, cleanups: [] });
  (document.getElementById("eraser") as HTMLButtonElement).click();
  expect(editor.setTool).toHaveBeenCalled();
});
