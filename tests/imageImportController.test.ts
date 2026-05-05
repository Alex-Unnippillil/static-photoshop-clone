import { initImageImport } from "../src/editor/imageImport.js";

test("image import does nothing without file", () => {
  document.body.innerHTML = `<input id='imageLoader' type='file' />`;
  const onImported = jest.fn();
  initImageImport({ getEditor: () => ({ saveState: jest.fn(), ctx: { drawImage: jest.fn() }, canvas: { width: 10, height: 10 } } as any), onImported, cleanups: [] });
  document.getElementById("imageLoader")!.dispatchEvent(new Event("change"));
  expect(onImported).not.toHaveBeenCalled();
});
