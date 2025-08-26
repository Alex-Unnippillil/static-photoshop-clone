import { Editor } from "../src/core/Editor.js";
import { EraserTool } from "../src/tools/EraserTool.js";

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
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
      clearRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      globalCompositeOperation: "source-over" as GlobalCompositeOperation,
      lineWidth: 0,
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

  it("uses destination-out compositing to erase", () => {
    const tool = new EraserTool();
    tool.onPointerDown({ offsetX: 5, offsetY: 5 } as PointerEvent, editor);
    expect(ctx.globalCompositeOperation).toBe("destination-out");

    tool.onPointerMove(
      { offsetX: 10, offsetY: 10, buttons: 1 } as PointerEvent,
      editor,
    );
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.stroke).toHaveBeenCalled();

    tool.onPointerUp({} as PointerEvent, editor);
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.globalCompositeOperation).toBe("source-over");
  });

  it("restores compositing mode on pointer up", () => {
    const tool = new EraserTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    expect(ctx.globalCompositeOperation).toBe("destination-out");

    tool.onPointerUp({} as PointerEvent, editor);
    expect(ctx.globalCompositeOperation).toBe("source-over");
  });
});
