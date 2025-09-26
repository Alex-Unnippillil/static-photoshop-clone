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

  afterEach(() => {
    BucketFillTool.setDefaults({ tolerance: 0, connectivity: 4 });
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

  it("fills large areas efficiently", () => {
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

    const last = (width * height - 1) * 4;
    expect(image.data[last]).toBe(0);
    expect(image.data[last + 1]).toBe(0);
    expect(image.data[last + 2]).toBe(255);
    expect(ctx.putImageData).toHaveBeenCalledWith(image, 0, 0);
  });

  it("fills neighboring pixels that are within the configured tolerance", () => {
    const width = 3;
    const height = 3;
    const data = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const offset = i * 4;
      data[offset] = 255;
      data[offset + 1] = 255;
      data[offset + 2] = 255;
      data[offset + 3] = 255;
    }
    // Starting pixel slightly darker than neighbors
    data[0] = 245;
    data[1] = 245;
    data[2] = 245;
    const image = { data, width, height } as ImageData;
    (ctx.getImageData as jest.Mock).mockReturnValueOnce(image);

    const tool = new BucketFillTool({ tolerance: 10 });
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);

    const last = (width * height - 1) * 4;
    expect(image.data[last]).toBe(0);
    expect(image.data[last + 1]).toBe(0);
    expect(image.data[last + 2]).toBe(255);
  });

  it("expands diagonally when using 8-way connectivity", () => {
    const createImage = () => {
      const width = 3;
      const height = 3;
      const data = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        const offset = i * 4;
        data[offset] = 0;
        data[offset + 1] = 0;
        data[offset + 2] = 0;
        data[offset + 3] = 255;
      }
      // Start and diagonal pixel share a color
      const start = 0;
      data[start] = 255;
      data[start + 1] = 255;
      data[start + 2] = 255;

      const diagonal = (1 * width + 1) * 4;
      data[diagonal] = 255;
      data[diagonal + 1] = 255;
      data[diagonal + 2] = 255;

      return { data, width, height } as ImageData;
    };

    const image4 = createImage();
    (ctx.getImageData as jest.Mock).mockReturnValueOnce(image4);

    const fourWayTool = new BucketFillTool({ connectivity: 4 });
    fourWayTool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);

    const diagonal = (1 * image4.width + 1) * 4;
    expect(image4.data[diagonal]).toBe(255);
    expect(image4.data[diagonal + 1]).toBe(255);
    expect(image4.data[diagonal + 2]).toBe(255);

    const image8 = createImage();
    (ctx.getImageData as jest.Mock).mockReturnValueOnce(image8);

    const eightWayTool = new BucketFillTool({ connectivity: 8 });
    eightWayTool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);

    expect(image8.data[diagonal]).toBe(0);
    expect(image8.data[diagonal + 1]).toBe(0);
    expect(image8.data[diagonal + 2]).toBe(255);
  });
});
