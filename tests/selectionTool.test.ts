import { Editor } from "../src/core/Editor.js";
import { SelectionTool } from "../src/tools/SelectionTool.js";

describe("SelectionTool", () => {
  let editor: Editor;
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let mockImage: ImageData;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="1" />
      <input id="fillMode" type="checkbox" />
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    mockImage = { data: new Uint8ClampedArray(), width: 100, height: 100 } as ImageData;
    ctx = {
      getImageData: jest.fn(() => mockImage),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      setLineDash: jest.fn(),
      strokeRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
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
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  afterEach(() => {
    editor.destroy();
  });

  function evt(x: number, y: number, buttons = 0): PointerEvent {
    return { offsetX: x, offsetY: y, buttons } as PointerEvent;
  }

  it("moves selection and supports undo/redo", () => {
    const tool = new SelectionTool();
    // create selection 0,0 to 10,10
    editor.saveState();
    tool.onPointerDown(evt(0, 0, 1), editor);
    tool.onPointerMove(evt(10, 10, 1), editor);
    tool.onPointerUp(evt(10, 10, 0), editor);
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 10, 10);

    // drag selection to roughly 19,19
    editor.saveState();
    tool.onPointerDown(evt(1, 1, 1), editor);
    tool.onPointerMove(evt(20, 20, 1), editor);
    tool.onPointerUp(evt(20, 20, 0), editor);

    const calls = (ctx.putImageData as jest.Mock).mock.calls;
    const last = calls[calls.length - 1];
    expect(last[1]).toBe(19);
    expect(last[2]).toBe(19);

    const count = calls.length;
    editor.undo();
    expect((ctx.putImageData as jest.Mock).mock.calls.length).toBe(count + 1);
    editor.redo();
    expect((ctx.putImageData as jest.Mock).mock.calls.length).toBe(count + 2);
  });
});

