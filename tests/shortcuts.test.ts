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
      <input id="lineWidth" value="1" />
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      strokeRect: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      scale: jest.fn(),
      drawImage: jest.fn(),
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

  it("switches tools with letter shortcuts", () => {
    const spy = jest.spyOn(handle.editor, "setTool");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "P" }));
    expect(spy.mock.calls[spy.mock.calls.length - 1][0]).toBeInstanceOf(PencilTool);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "R" }));
    expect(spy.mock.calls[spy.mock.calls.length - 1][0]).toBeInstanceOf(RectangleTool);
  });

  it("performs undo and redo shortcuts", () => {
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
