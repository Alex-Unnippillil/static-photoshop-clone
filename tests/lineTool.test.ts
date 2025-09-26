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

  it("snaps angles to 45° increments when shift is held", () => {
    const tool = new LineTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerMove({
      offsetX: 10,
      offsetY: 5,
      buttons: 1,
      shiftKey: true,
    } as PointerEvent, editor);
    const args = (ctx.lineTo as jest.Mock).mock.calls.pop();
    const dx = 10;
    const dy = 5;
    const angle = Math.atan2(dy, dx);
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const length = Math.sqrt(dx * dx + dy * dy);
    const expectedX = length * Math.cos(snapped);
    const expectedY = length * Math.sin(snapped);
    expect(args[0]).toBeCloseTo(expectedX);
    expect(args[1]).toBeCloseTo(expectedY);
  });

  it("snaps to grid when enabled", () => {
    const tool = new LineTool();
    editor.setSnapping({ grid: true });
    tool.onPointerDown({ offsetX: 23, offsetY: 27 } as PointerEvent, editor);
    tool.onPointerMove({
      offsetX: 46,
      offsetY: 54,
      buttons: 1,
    } as PointerEvent, editor);

    expect(ctx.moveTo).toHaveBeenCalledWith(20, 30);
    const [lineToArgs] = (ctx.lineTo as jest.Mock).mock.calls;
    expect(lineToArgs[0]).toBe(50);
    expect(lineToArgs[1]).toBe(50);
  });

  it("snaps to axis guides when enabled", () => {
    const tool = new LineTool();
    editor.setSnapping({ guides: true });
    tool.onPointerDown({ offsetX: 10, offsetY: 10 } as PointerEvent, editor);
    tool.onPointerMove({
      offsetX: 12,
      offsetY: 40,
      buttons: 1,
    } as PointerEvent, editor);

    const [firstLine] = (ctx.lineTo as jest.Mock).mock.calls;
    expect(firstLine[0]).toBe(10);
    expect(firstLine[1]).toBe(40);

    (ctx.lineTo as jest.Mock).mockClear();
    tool.onPointerMove({
      offsetX: 40,
      offsetY: 12,
      buttons: 1,
    } as PointerEvent, editor);
    const afterClear = (ctx.lineTo as jest.Mock).mock.calls[0];
    expect(afterClear[0]).toBe(40);
    expect(afterClear[1]).toBe(10);
  });

  it("snaps angles when toggle is enabled", () => {
    const tool = new LineTool();
    editor.setSnapping({ angle: true });
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerMove({
      offsetX: 12,
      offsetY: 7,
      buttons: 1,
    } as PointerEvent, editor);

    const [call] = (ctx.lineTo as jest.Mock).mock.calls;
    const dx = 12;
    const dy = 7;
    const angle = Math.atan2(dy, dx);
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const length = Math.sqrt(dx * dx + dy * dy);
    const expectedX = length * Math.cos(snapped);
    const expectedY = length * Math.sin(snapped);
    expect(call[0]).toBeCloseTo(expectedX);
    expect(call[1]).toBeCloseTo(expectedY);
  });
});
