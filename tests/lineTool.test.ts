import { Editor } from "../src/core/Editor";
import { LineTool } from "../src/tools/LineTool";

describe("LineTool", () => {
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
      moveTo: jest.fn(),
      lineTo: jest.fn(),
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

  it("draws a line on pointer up", () => {
    const tool = new LineTool();
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 3, offsetY: 4 } as PointerEvent, editor);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(1, 2);
    expect(ctx.lineTo).toHaveBeenCalledWith(3, 4);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
  });
});
