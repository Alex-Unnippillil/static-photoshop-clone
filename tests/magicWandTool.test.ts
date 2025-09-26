import { Editor } from "../src/core/Editor.js";
import { MagicWandTool } from "../src/tools/MagicWandTool.js";

describe("MagicWandTool", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor;
  let toleranceInput: HTMLInputElement;
  let connectivitySelect: HTMLSelectElement;
  const width = 3;
  const height = 3;
  let data: Uint8ClampedArray;
  let setPixel: (
    x: number,
    y: number,
    r: number,
    g: number,
    b: number,
    a?: number,
  ) => void;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="1" />
      <input id="fillMode" type="checkbox" />
      <input id="magicTolerance" value="10" />
      <select id="magicConnectivity">
        <option value="4" selected>4</option>
        <option value="8">8</option>
      </select>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;
    canvas.getBoundingClientRect = () => ({
      width,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: width,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    data = new Uint8ClampedArray(width * height * 4);
    setPixel = (
      x: number,
      y: number,
      r: number,
      g: number,
      b: number,
      a = 255,
    ) => {
      const idx = (y * width + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    };

    const image = { data, width, height } as ImageData;
    ctx = {
      getImageData: jest.fn().mockReturnValue(image),
      setTransform: jest.fn(),
      scale: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);

    toleranceInput = document.getElementById(
      "magicTolerance",
    ) as HTMLInputElement;
    connectivitySelect = document.getElementById(
      "magicConnectivity",
    ) as HTMLSelectElement;

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
      undefined,
      undefined,
      undefined,
      toleranceInput,
      connectivitySelect,
    );
  });

  it("creates a mask constrained by tolerance", () => {
    const tool = new MagicWandTool();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        setPixel(x, y, 230, 230, 230);
      }
    }
    setPixel(1, 1, 200, 200, 200);
    setPixel(1, 0, 205, 205, 205);
    setPixel(1, 2, 205, 205, 205);
    setPixel(0, 1, 205, 205, 205);
    setPixel(2, 1, 205, 205, 205);

    toleranceInput.value = "4";

    tool.onPointerDown({ offsetX: 1, offsetY: 1 } as PointerEvent, editor);

    const mask = editor.selectionMask;
    expect(mask).not.toBeNull();
    expect(mask?.width).toBe(width);
    expect(mask?.height).toBe(height);
    // only center pixel should be selected with low tolerance
    expect(Array.from(mask!.data)).toEqual([
      0,
      0,
      0,
      0,
      255,
      0,
      0,
      0,
      0,
    ]);

    toleranceInput.value = "6";
    tool.onPointerDown({ offsetX: 1, offsetY: 1 } as PointerEvent, editor);
    expect(Array.from(editor.selectionMask!.data)).toEqual([
      0,
      255,
      0,
      255,
      255,
      255,
      0,
      255,
      0,
    ]);
  });

  it("expands selection based on connectivity", () => {
    const tool = new MagicWandTool();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        setPixel(x, y, 230, 230, 230);
      }
    }
    setPixel(1, 1, 200, 200, 200);
    setPixel(2, 2, 205, 205, 205);

    toleranceInput.value = "10";

    // 4-way connectivity should not include diagonal neighbor
    connectivitySelect.value = "4";
    tool.onPointerDown({ offsetX: 1, offsetY: 1 } as PointerEvent, editor);
    expect(Array.from(editor.selectionMask!.data)).toEqual([
      0,
      0,
      0,
      0,
      255,
      0,
      0,
      0,
      0,
    ]);

    // 8-way connectivity should include the diagonal pixel as well
    connectivitySelect.value = "8";
    tool.onPointerDown({ offsetX: 1, offsetY: 1 } as PointerEvent, editor);
    expect(Array.from(editor.selectionMask!.data)).toEqual([
      0,
      0,
      0,
      0,
      255,
      0,
      0,
      0,
      255,
    ]);
  });
});
