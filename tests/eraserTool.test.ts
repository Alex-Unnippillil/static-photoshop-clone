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
      clearRect: jest.fn(),
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

  it("clears the area under the cursor", () => {
    const tool = new EraserTool();
    tool.onPointerDown({ offsetX: 15, offsetY: 15 } as PointerEvent, editor);
    expect(ctx.clearRect).toHaveBeenCalledWith(10, 10, 10, 10);
  });

  it("erases on pointer move when pressed", () => {
    const tool = new EraserTool();
    tool.onPointerMove(
      { offsetX: 20, offsetY: 20, buttons: 1 } as PointerEvent,
      editor,
    );
    expect(ctx.clearRect).toHaveBeenCalledWith(15, 15, 10, 10);
  });
});
