import { Editor } from "../src/core/Editor";
import { RectangleTool } from "../src/tools/RectangleTool";
import { DrawingTool } from "../src/tools/DrawingTool";

describe("RectangleTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const mockImage = {
      data: new Uint8ClampedArray(),
      width: 100,
      height: 100,
    } as ImageData;

    ctx = {
      getImageData: jest.fn(() => mockImage),
      putImageData: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
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

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
    );
  });

  afterEach(() => {
    editor.destroy();
  });

  it("draws a rectangle on pointer up", () => {
    const tool = new RectangleTool();
    expect(tool).toBeInstanceOf(DrawingTool);
    tool.onPointerDown({ offsetX: 10, offsetY: 15 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 20, offsetY: 25 } as PointerEvent, editor);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 15, 10, 10);
  });
});

