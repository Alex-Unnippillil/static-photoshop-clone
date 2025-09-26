import { Editor } from "../../src/core/Editor.js";
import { BucketFillTool } from "../../src/tools/BucketFillTool.js";
import { measurePerformance, flushPerformanceResults } from "./harness.js";

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getBoundingClientRect = () => ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON() {
      return this;
    },
  });
  (canvas as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {};
  (canvas as unknown as { releasePointerCapture: () => void }).releasePointerCapture = () => {};
  return canvas;
}

function createImage(width: number, height: number, color: [number, number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = color[3];
  }
  return { data, width, height } as ImageData;
}

describe("Performance budgets", () => {
  afterAll(() => {
    flushPerformanceResults();
  });

  it("fills large canvases within the bucket fill budget", async () => {
    const width = 1000;
    const height = 1000;
    const canvas = createCanvas(width, height);

    const image = createImage(width, height, [255, 255, 255, 255]);
    const ctx: Partial<CanvasRenderingContext2D> = {
      getImageData: jest.fn().mockReturnValue(image),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);

    const colorPicker = document.createElement("input");
    colorPicker.value = "#1234ff";
    const lineWidth = document.createElement("input");
    lineWidth.value = "1";
    const fillMode = document.createElement("input");
    fillMode.type = "checkbox";

    const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);

    const tool = new BucketFillTool();

    await measurePerformance(
      "bucketFill.largeArea",
      () => {
        tool.onPointerDown({ offsetX: width / 2, offsetY: height / 2 } as PointerEvent, editor);
      },
      { pixels: width * height },
    );

    const lastPixel = ((width * height - 1) * 4) as number;
    expect(image.data[lastPixel]).toBe(18);
    expect(image.data[lastPixel + 1]).toBe(52);
    expect(image.data[lastPixel + 2]).toBe(255);
    expect(ctx.putImageData).toHaveBeenCalledWith(image, 0, 0);

    editor.destroy();
  });

  it("handles 4k resize operations within the transform budget", async () => {
    const width = 2048;
    const height = 2048;
    const canvas = createCanvas(width, height);

    const image = createImage(width, height, [0, 0, 0, 255]);
    const ctx: Partial<CanvasRenderingContext2D> = {
      getImageData: jest.fn().mockReturnValue(image),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);

    const colorPicker = document.createElement("input");
    colorPicker.value = "#000000";
    const lineWidth = document.createElement("input");
    lineWidth.value = "1";
    const fillMode = document.createElement("input");
    fillMode.type = "checkbox";

    const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);

    const handleResize = (editor as unknown as { handleResize: () => void }).handleResize;

    await measurePerformance(
      "editor.resize.4k",
      () => {
        handleResize.call(editor);
      },
      { width, height, pixels: width * height },
    );

    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalledWith(image, 0, 0);

    editor.destroy();
  });
});
