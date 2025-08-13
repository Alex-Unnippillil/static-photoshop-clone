import { Editor } from "../src/core/Editor";
import { EraserTool } from "../src/tools/EraserTool";

describe("EraserTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="10" />
      <input id="fillMode" type="checkbox" />
    `;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      clearRect: jest.fn(),
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

  it("clears rectangles to erase", () => {
    const tool = new EraserTool();
    tool.onPointerDown({ offsetX: 5, offsetY: 5 } as PointerEvent, editor);
    expect(ctx.clearRect).toHaveBeenCalled();
    tool.onPointerMove(
      { offsetX: 10, offsetY: 10, buttons: 1 } as PointerEvent,
      editor,
    );
    expect(ctx.clearRect).toHaveBeenCalledTimes(2);
  });
});
