import { Editor } from "../src/core/Editor";
import { RectangleTool } from "../src/tools/RectangleTool";

describe("RectangleTool", () => {
  let editor: Editor;
  let ctx: any;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      getImageData: jest.fn().mockReturnValue({} as ImageData),
      putImageData: jest.fn(),
      strokeRect: jest.fn(),
      fillRect: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx);
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  it("draws a rectangle on pointer up", () => {
    const tool = new RectangleTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 15 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 20, offsetY: 25 } as PointerEvent, editor);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 15, 10, 10);
  });

  it("fills when editor.fill is true", () => {
    const tool = new RectangleTool();
    (document.getElementById("fillMode") as HTMLInputElement).checked = true;
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 5, offsetY: 5 } as PointerEvent, editor);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 5, 5);
  });
});

