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
      save: jest.fn(),
      restore: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  it("fills enclosed areas with the selected color", () => {
    const tool = new BucketFillTool();
    tool.onPointerDown({ offsetX: 2, offsetY: 2 } as PointerEvent, editor);

    const image = (ctx.getImageData as jest.Mock).mock.results[0].value as ImageData;
    const center = (2 * 5 + 2) * 4;
    // blue from colorPicker (#0000ff)
    expect(image.data[center]).toBe(0);
    expect(image.data[center + 1]).toBe(0);
    expect(image.data[center + 2]).toBe(255);
    // ensure border untouched
    const corner = 0;
    expect(image.data[corner]).toBe(0);
    expect(image.data[corner + 1]).toBe(0);
    expect(image.data[corner + 2]).toBe(0);
    expect(ctx.putImageData).toHaveBeenCalledWith(image, 0, 0);
  });
});
