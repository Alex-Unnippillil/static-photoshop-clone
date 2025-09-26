import { Editor } from "../src/core/Editor.js";
import { TransformTool } from "../src/tools/TransformTool.js";

describe("TransformTool", () => {
  function createEditor() {
    document.body.innerHTML = `
      <div id="container"><canvas id="canvas"></canvas></div>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const color = document.getElementById("colorPicker") as HTMLInputElement;
    const width = document.getElementById("lineWidth") as HTMLInputElement;
    const fill = document.getElementById("fillMode") as HTMLInputElement;

    const rect = {
      width: 10,
      height: 10,
      top: 0,
      left: 0,
      right: 10,
      bottom: 10,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect;
    canvas.getBoundingClientRect = () => rect;

    const basePixels = new Uint8ClampedArray(10 * 10 * 4);
    for (let y = 2; y < 6; y += 1) {
      for (let x = 2; x < 6; x += 1) {
        const index = (y * 10 + x) * 4;
        basePixels[index] = 255;
        basePixels[index + 3] = 255;
      }
    }
    let currentPixels = new Uint8ClampedArray(basePixels);

    const makeImageData = (sw: number, sh: number): ImageData =>
      ({
        data: new Uint8ClampedArray(sw * sh * 4),
        width: sw,
        height: sh,
      } as ImageData);

    const originalCreateElement = document.createElement.bind(document);
    document.createElement = ((tag: string) => {
      if (tag.toLowerCase() === "canvas") {
        const offscreen = originalCreateElement(tag) as HTMLCanvasElement;
        offscreen.getContext = jest.fn().mockImplementation((type: string) => {
          if (type !== "2d") return null;
          return {
            putImageData: jest.fn(),
            drawImage: jest.fn(),
            clearRect: jest.fn(),
            getImageData: jest
              .fn()
              .mockImplementation((sx: number, sy: number, sw: number, sh: number) =>
                makeImageData(sw, sh),
              ),
          } as unknown as CanvasRenderingContext2D;
        });
        return offscreen as any;
      }
      return originalCreateElement(tag);
    }) as typeof document.createElement;

    const getImageData = jest.fn(
      (sx: number, sy: number, sw: number, sh: number) => {
        const image = makeImageData(sw, sh);
        for (let y = 0; y < sh; y += 1) {
          for (let x = 0; x < sw; x += 1) {
            const src = ((sy + y) * 10 + (sx + x)) * 4;
            const dest = (y * sw + x) * 4;
            image.data[dest] = currentPixels[src];
            image.data[dest + 1] = currentPixels[src + 1];
            image.data[dest + 2] = currentPixels[src + 2];
            image.data[dest + 3] = currentPixels[src + 3];
          }
        }
        return image;
      },
    );

    const putImageData = jest.fn((image: ImageData, dx: number, dy: number) => {
      for (let y = 0; y < image.height; y += 1) {
        for (let x = 0; x < image.width; x += 1) {
          const src = (y * image.width + x) * 4;
          const dest = ((dy + y) * 10 + (dx + x)) * 4;
          currentPixels[dest] = image.data[src];
          currentPixels[dest + 1] = image.data[src + 1];
          currentPixels[dest + 2] = image.data[src + 2];
          currentPixels[dest + 3] = image.data[src + 3];
        }
      }
    });

    const clearRect = jest.fn((x: number, y: number, w: number, h: number) => {
      const startX = Math.floor(x);
      const startY = Math.floor(y);
      const endX = Math.min(10, Math.ceil(x + w));
      const endY = Math.min(10, Math.ceil(y + h));
      for (let yy = startY; yy < endY; yy += 1) {
        for (let xx = startX; xx < endX; xx += 1) {
          currentPixels[(yy * 10 + xx) * 4 + 3] = 0;
        }
      }
    });

    const drawImage = jest.fn();

    const ctx = {
      getImageData,
      putImageData,
      clearRect,
      drawImage,
      setTransform: jest.fn(),
      scale: jest.fn(),
    } as unknown as CanvasRenderingContext2D;

    canvas.getContext = jest.fn().mockReturnValue(ctx);

    const editor = new Editor(canvas, color, width, fill);
    const restore = () => {
      document.createElement = originalCreateElement;
    };
    return { editor, drawImage, restore };
  }

  it("moves the current selection when dragged", () => {
    const { editor, drawImage, restore } = createEditor();
    const tool = new TransformTool();
    editor.setTool(tool);

    try {
      const down = { offsetX: 3, offsetY: 3, pointerId: 1, button: 0 } as PointerEvent;
      tool.onPointerDown(down, editor);
      tool.onPointerMove({ offsetX: 5, offsetY: 6, pointerId: 1 } as PointerEvent, editor);
      tool.onPointerUp({ offsetX: 5, offsetY: 6, pointerId: 1 } as PointerEvent, editor);

      const selection = editor.getSelection();
      expect(selection?.bounds).toEqual({ x: 4, y: 5, width: 4, height: 4 });
      const lastCall = drawImage.mock.calls.at(-1);
      expect(lastCall?.slice(5)).toEqual([4, 5, 4, 4]);
    } finally {
      restore();
      editor.destroy();
    }
  });

  it("resizes the selection via handles", () => {
    const { editor, drawImage, restore } = createEditor();
    const tool = new TransformTool();
    editor.setTool(tool);

    try {
      const handle = document.querySelector(
        ".selection-handle[data-handle=\"se\"]",
      ) as HTMLDivElement;
      const pointerDown = new MouseEvent("pointerdown", { bubbles: true });
      Object.defineProperty(pointerDown, "pointerId", { value: 2 });
      Object.defineProperty(pointerDown, "button", { value: 0 });
      Object.defineProperty(pointerDown, "clientX", { value: 6 });
      Object.defineProperty(pointerDown, "clientY", { value: 6 });
      handle.dispatchEvent(pointerDown);

      const pointerMove = new MouseEvent("pointermove", { bubbles: true });
      Object.defineProperty(pointerMove, "pointerId", { value: 2 });
      Object.defineProperty(pointerMove, "clientX", { value: 8 });
      Object.defineProperty(pointerMove, "clientY", { value: 9 });
      handle.dispatchEvent(pointerMove);

      const pointerUp = new MouseEvent("pointerup", { bubbles: true });
      Object.defineProperty(pointerUp, "pointerId", { value: 2 });
      Object.defineProperty(pointerUp, "clientX", { value: 8 });
      Object.defineProperty(pointerUp, "clientY", { value: 9 });
      handle.dispatchEvent(pointerUp);

      const selection = editor.getSelection();
      expect(selection?.bounds).toEqual({ x: 2, y: 2, width: 6, height: 7 });
      const lastCall = drawImage.mock.calls.at(-1);
      expect(lastCall?.slice(5)).toEqual([2, 2, 6, 7]);
    } finally {
      restore();
      editor.destroy();
    }
  });
});
