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
      <input id="fillMode" type="checkbox" />
    `;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const imageData = {} as ImageData;
    ctx = {
      getImageData: jest.fn().mockReturnValue(imageData),
      putImageData: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      closePath: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
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

  it("previews circle during pointer move", () => {
    const tool = new CircleTool();
    tool.onPointerDown({ offsetX: 2, offsetY: 3 } as PointerEvent, editor);
    tool.onPointerMove({
      offsetX: 5,
      offsetY: 7,
      buttons: 1,
    } as PointerEvent, editor);

    expect(ctx.getImageData).toHaveBeenCalled();
    const image = (ctx.getImageData as jest.Mock).mock.results[0].value;
    expect(ctx.putImageData).toHaveBeenCalledWith(image, 0, 0);
    const dx = 5 - 2;
    const dy = 7 - 3;
    const radius = Math.sqrt(dx * dx + dy * dy);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledWith(2, 3, radius, 0, Math.PI * 2);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("fills circle on pointer up when enabled", () => {
    const tool = new CircleTool();
    (document.getElementById("fillMode") as HTMLInputElement).checked = true;
    tool.onPointerDown({ offsetX: 2, offsetY: 3 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 5, offsetY: 7 } as PointerEvent, editor);
    expect(ctx.fill).toHaveBeenCalled();
  });
});
