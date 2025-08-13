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
      <input id="fillMode" type="checkbox" />
    `;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const imageData = {} as ImageData;
    ctx = {
      getImageData: jest.fn().mockReturnValue(imageData),
      putImageData: jest.fn(),
      strokeRect: jest.fn(),
      fillRect: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  it("draws a rectangle on pointer up", () => {
    const tool = new RectangleTool();
    expect(tool).toBeInstanceOf(DrawingTool);
    tool.onPointerDown({ offsetX: 10, offsetY: 15 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 20, offsetY: 25 } as PointerEvent, editor);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 15, 10, 10);
    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("fills rectangle when fillMode checked", () => {
    const tool = new RectangleTool();
    (document.getElementById("fillMode") as HTMLInputElement).checked = true;
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 3, offsetY: 4 } as PointerEvent, editor);
    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
