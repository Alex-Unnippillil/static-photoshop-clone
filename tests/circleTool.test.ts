import { Editor } from "../src/core/Editor";
import { CircleTool } from "../src/tools/CircleTool";

describe("CircleTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
    `;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      beginPath: jest.fn(),
      arc: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
    );
  });

  it("draws a circle on pointer up", () => {
    const tool = new CircleTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 10 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 13, offsetY: 14 } as PointerEvent, editor);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledWith(10, 10, 5, 0, Math.PI * 2);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
  });
});
