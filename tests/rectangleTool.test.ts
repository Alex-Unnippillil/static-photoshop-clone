import { Editor } from "../src/core/Editor.js";
import { RectangleTool } from "../src/tools/RectangleTool.js";
import { DrawingTool } from "../src/tools/DrawingTool.js";

describe("RectangleTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
        <input id="lineWidth" value="2" />
        <input id="fillMode" type="checkbox" />
        <select id="fontFamily"><option value="sans-serif"></option></select>
        <input id="fontSize" value="16" />
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    const mockImage = {
      data: new Uint8ClampedArray(),
      width: 100,
      height: 100,
    } as ImageData;

    ctx = {
      getImageData: jest.fn(() => mockImage),
      putImageData: jest.fn(),
      strokeRect: jest.fn(),
      fillRect: jest.fn(),
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
        document.getElementById("fillMode") as HTMLInputElement,
        document.getElementById("fontFamily") as HTMLSelectElement,
        document.getElementById("fontSize") as HTMLInputElement,
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

  it("fills a rectangle when fill mode is enabled", () => {
    const tool = new RectangleTool();
    (document.getElementById("fillMode") as HTMLInputElement).checked = true;
    tool.onPointerDown({ offsetX: 10, offsetY: 15 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 20, offsetY: 25 } as PointerEvent, editor);
    expect(ctx.fillRect).toHaveBeenCalledWith(10, 15, 10, 10);
  });
});

