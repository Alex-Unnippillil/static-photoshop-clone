import { Editor } from "../src/core/Editor";
import { LineTool } from "../src/tools/LineTool";

describe("LineTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id=\"canvas\"></canvas>
      <input id=\"colorPicker\" value=\"#000000\" />
      <input id=\"lineWidth\" value=\"2\" />
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
    tool.onPointerDown({ offsetX: 5, offsetY: 6 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 8, offsetY: 9 } as PointerEvent, editor);
    expect(ctx.moveTo).toHaveBeenCalledWith(5, 6);
    expect(ctx.lineTo).toHaveBeenCalledWith(8, 9);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
