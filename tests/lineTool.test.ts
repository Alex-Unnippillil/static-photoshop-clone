import { Editor } from "../src/core/Editor.js";
import { LineTool } from "../src/tools/LineTool.js";

describe("LineTool", () => {
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
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    const imageData = {
      data: new Uint8ClampedArray(),
      width: 100,
      height: 100,
    } as ImageData;
    ctx = {
      getImageData: jest.fn().mockReturnValue(imageData),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      strokeStyle: "red",
      fillStyle: "blue",
      lineWidth: 5,
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

  it("renders line preview during drag", () => {
    const tool = new LineTool();
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    tool.onPointerMove({
      offsetX: 3,
      offsetY: 4,
      buttons: 1,
    } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 3, offsetY: 4 } as PointerEvent, editor);

    expect(ctx.getImageData).toHaveBeenCalled();
    const image = (ctx.getImageData as jest.Mock).mock.results[0].value;
    expect(ctx.putImageData).toHaveBeenCalledTimes(2);
    expect(ctx.putImageData).toHaveBeenNthCalledWith(1, image, 0, 0);
    expect(ctx.putImageData).toHaveBeenNthCalledWith(2, image, 0, 0);
    expect(ctx.beginPath).toHaveBeenCalledTimes(2);
    expect(ctx.moveTo).toHaveBeenCalledWith(1, 2);
    expect(ctx.lineTo).toHaveBeenCalledWith(3, 4);
    expect(ctx.stroke).toHaveBeenCalledTimes(2);
    expect(ctx.closePath).toHaveBeenCalledTimes(2);
    expect(ctx.strokeStyle).toBe(editor.strokeStyle);
    expect(ctx.fillStyle).toBe(editor.fillStyle);
    expect(ctx.lineWidth).toBe(editor.lineWidthValue);
  });

  it("draws line on pointer up", () => {
    const tool = new LineTool();
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 5, offsetY: 6 } as PointerEvent, editor);
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(1, 2);
    expect(ctx.lineTo).toHaveBeenCalledWith(5, 6);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("supports undo after drawing", () => {
    const tool = new LineTool();
    editor.saveState();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 1, offsetY: 1 } as PointerEvent, editor);
    editor.undo();
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.putImageData).toHaveBeenCalledTimes(2);
  });
});
