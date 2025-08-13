import { initEditor, EditorHandle } from "../src/editor";
import { PencilTool } from "../src/tools/PencilTool";
import { RectangleTool } from "../src/tools/RectangleTool";

describe("keyboard shortcuts", () => {
  let handle: EditorHandle;
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <button id="save"></button>
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      drawImage: jest.fn(),
      scale: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.toDataURL = jest.fn();
    canvas.getBoundingClientRect = () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    handle = initEditor();
  });

  afterEach(() => {
    handle.destroy();
  });

  it("switches tools with key presses", () => {
    const spy = jest.spyOn(handle.editor, "setTool");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    expect(spy).toHaveBeenCalledWith(expect.any(PencilTool));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(spy).toHaveBeenCalledWith(expect.any(RectangleTool));
  });

  it("triggers undo and redo", () => {
    const undoSpy = jest.spyOn(handle.editor, "undo");
    const redoSpy = jest.spyOn(handle.editor, "redo");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
    expect(undoSpy).toHaveBeenCalled();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true })
    );
    expect(redoSpy).toHaveBeenCalled();
  });
});
