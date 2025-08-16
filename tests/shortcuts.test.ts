import { initEditor, EditorHandle } from "../src/editor";
import { RectangleTool } from "../src/tools/RectangleTool";
import { PencilTool } from "../src/tools/PencilTool";

describe("keyboard shortcuts", () => {
  let handle: EditorHandle;
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    ctx = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
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

  it("switches tools with letter keys", () => {
    const spy = jest.spyOn(handle.editor, "setTool");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(spy.mock.calls[0][0]).toBeInstanceOf(RectangleTool);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    expect(spy.mock.calls[1][0]).toBeInstanceOf(PencilTool);
  });

  it("performs undo and redo with shortcuts", () => {
    const undo = jest.spyOn(handle.editor, "undo").mockImplementation(() => {});
    const redo = jest.spyOn(handle.editor, "redo").mockImplementation(() => {});
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
    expect(undo).toHaveBeenCalled();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true }),
    );
    expect(redo).toHaveBeenCalled();
  });
});
