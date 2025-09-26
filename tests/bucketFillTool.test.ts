import { Editor } from "../src/core/Editor.js";
import { BucketFillTool } from "../src/tools/BucketFillTool.js";

describe("BucketFillTool", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#0000ff" />
      <input id="lineWidth" value="1" />
      <input id="fillMode" type="checkbox" />
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();

    const width = 5;
    const height = 5;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const border = x === 0 || y === 0 || x === width - 1 || y === height - 1;
        data[idx] = border ? 0 : 255;
        data[idx + 1] = border ? 0 : 255;
        data[idx + 2] = border ? 0 : 255;
        data[idx + 3] = 255;
      }
    }
    const image = { data, width, height } as ImageData;
    ctx = {
      getImageData: jest.fn().mockReturnValue(image),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  it("fills enclosed areas with the selected color", async () => {
    const tool = new BucketFillTool();
    tool.onPointerDown({ offsetX: 2, offsetY: 2 } as PointerEvent, editor);

    await Promise.resolve();

    const call = (ctx.putImageData as jest.Mock).mock.calls[0];
    expect(call[1]).toBe(1);
    expect(call[2]).toBe(1);

    const result = call[0] as ImageData;
    expect(result.width).toBe(3);
    expect(result.height).toBe(3);
    const data = result.data;

    // ensure center pixel of rect is blue (#0000ff)
    const center = ((1 * result.width + 1) * 4) | 0;
    expect(data[center]).toBe(0);
    expect(data[center + 1]).toBe(0);
    expect(data[center + 2]).toBe(255);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);
  });

  it("fills large areas efficiently", async () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
    const image = { data, width, height } as ImageData;
    (ctx.getImageData as jest.Mock).mockReturnValueOnce(image);

    const tool = new BucketFillTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);

    await Promise.resolve();

    const call = (ctx.putImageData as jest.Mock).mock.calls[0];
    const result = call[0] as ImageData;
    expect(call[1]).toBe(0);
    expect(call[2]).toBe(0);
    expect(result.width * result.height).toBe(width * height);
    const last = (result.data.length / 4 - 1) * 4;
    expect(result.data[last]).toBe(0);
    expect(result.data[last + 1]).toBe(0);
    expect(result.data[last + 2]).toBe(255);
  });
});
