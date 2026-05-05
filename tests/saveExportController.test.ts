import { initSaveExport } from "../src/editor/saveExport.js";

test("save export triggers anchor click", () => {
  document.body.innerHTML = `<button id='save'></button><select id='formatSelect'><option>png</option></select><canvas id='c'></canvas>`;
  const canvas = document.getElementById("c") as HTMLCanvasElement;
  canvas.toDataURL = jest.fn().mockReturnValue("data:image/png;base64,X");
  const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  initSaveExport({ canvases: [canvas], getEditor: () => ({ canvas } as any), cleanups: [] });
  (document.getElementById("save") as HTMLButtonElement).click();
  expect(click).toHaveBeenCalled();
  click.mockRestore();
});
