import { Editor } from "../src/core/Editor.js";
import { CloneStampTool } from "../src/tools/CloneStampTool.js";

describe("CloneStampTool", () => {
  let canvas: HTMLCanvasElement;
  let ctx: (Partial<CanvasRenderingContext2D> & {
    putImageData: jest.Mock;
    getImageData: jest.Mock;
    clearRect: jest.Mock;
  }) & {
    setTransform: jest.Mock;
    scale: jest.Mock;
  };
  let editor: Editor;
  let tool: CloneStampTool;
  let snapshot: ImageData;

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
    canvas.getBoundingClientRect = () => ({
      width: 10,
      height: 10,
      top: 0,
      left: 0,
      bottom: 10,
      right: 10,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        data[index] = x;
        data[index + 1] = y;
        data[index + 2] = 0;
        data[index + 3] = 255;
      }
    }
    snapshot = { data, width, height } as ImageData;

    ctx = {
      putImageData: jest.fn(),
      getImageData: jest.fn(() => snapshot),
      clearRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };

    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );

    tool = new CloneStampTool();
  });

  it("samples from the aligned source location", () => {
    tool.onPointerDown(
      { altKey: true, offsetX: 2, offsetY: 2 } as PointerEvent,
      editor,
    );

    editor.saveState();
    tool.onPointerDown(
      { altKey: false, offsetX: 6, offsetY: 4 } as PointerEvent,
      editor,
    );
    tool.onPointerMove(
      { buttons: 1, offsetX: 7, offsetY: 4 } as PointerEvent,
      editor,
    );

    const lastCall = ctx.putImageData.mock.calls.at(-1);
    expect(lastCall).toBeTruthy();
    const [imageData, dx, dy] = lastCall!;
    expect(dx).toBe(7);
    expect(dy).toBe(4);
    expect(imageData.width).toBe(1);
    expect(imageData.height).toBe(1);
    expect(Array.from(imageData.data)).toEqual([3, 2, 0, 255]);
  });

  it("participates in undo/redo history", () => {
    tool.onPointerDown(
      { altKey: true, offsetX: 2, offsetY: 2 } as PointerEvent,
      editor,
    );

    editor.saveState();
    tool.onPointerDown(
      { altKey: false, offsetX: 6, offsetY: 4 } as PointerEvent,
      editor,
    );
    tool.onPointerMove(
      { buttons: 1, offsetX: 7, offsetY: 4 } as PointerEvent,
      editor,
    );
    tool.onPointerUp(
      { offsetX: 7, offsetY: 4 } as PointerEvent,
      editor,
    );

    const beforeUndo = ctx.putImageData.mock.calls.length;
    editor.undo();
    expect(ctx.putImageData.mock.calls.length).toBe(beforeUndo + 1);
    editor.redo();
    expect(ctx.putImageData.mock.calls.length).toBe(beforeUndo + 2);
  });
});
