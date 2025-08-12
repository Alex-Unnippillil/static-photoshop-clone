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
    `;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      scale: jest.fn(),
      globalCompositeOperation: "source-over",
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

  it("sets up erasing on pointer down", () => {
    const tool = new EraserTool();
    tool.onPointerDown({ offsetX: 15, offsetY: 15 } as PointerEvent, editor);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(15, 15);
    expect(ctx.globalCompositeOperation).toBe("destination-out");
    tool.onPointerUp({} as PointerEvent, editor);
    expect(ctx.globalCompositeOperation).toBe("source-over");
  });

  it("erases on pointer move when pressed", () => {
    const tool = new EraserTool();
    tool.onPointerDown({ offsetX: 15, offsetY: 15 } as PointerEvent, editor);
    tool.onPointerMove(
      { offsetX: 20, offsetY: 20, buttons: 1 } as PointerEvent,
      editor,
    );
    expect(ctx.lineTo).toHaveBeenCalledWith(20, 20);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
