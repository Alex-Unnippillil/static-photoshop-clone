import { Editor } from "../src/core/Editor";
import { TextTool } from "../src/tools/TextTool";

describe("TextTool", () => {
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
      fillText: jest.fn(),
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

  it("renders prompted text", () => {
    const tool = new TextTool();
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("Hi");
    tool.onPointerDown({ offsetX: 5, offsetY: 6 } as PointerEvent, editor);
    expect(promptSpy).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith("Hi", 5, 6);
    promptSpy.mockRestore();
  });
});
