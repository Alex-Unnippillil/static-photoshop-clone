import { DevicePixelRatioService } from "../src/core/DevicePixelRatioService.js";
import { Editor } from "../src/core/Editor.js";
import { PencilTool } from "../src/tools/PencilTool.js";
import { RectangleTool } from "../src/tools/RectangleTool.js";

describe("color rendering", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D> & {
    strokeStyle: string;
    fillStyle: string;
    lineWidth: number;
  };
  let editor: Editor;
  let dprService: DevicePixelRatioService;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#111111" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;

    const mockImage = {
      data: new Uint8ClampedArray(),
      width: 0,
      height: 0,
    } as ImageData;

    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      strokeRect: jest.fn(),
      fillRect: jest.fn(),
      getImageData: jest.fn(() => mockImage),
      putImageData: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      strokeStyle: "",
      fillStyle: "",
      lineWidth: 0,
      setTransform: jest.fn(),
      scale: jest.fn(),
    };

    canvas.getContext = jest.fn().mockReturnValue(ctx);
    canvas.getBoundingClientRect = () => ({
      width: 100,
      height: 100,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    dprService = new DevicePixelRatioService();
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
      undefined,
      undefined,
      dprService,
    );
  });

  afterEach(() => {
    editor.destroy();
    dprService.destroy();
  });

  it("uses the selected color for strokes and fills", () => {
    const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;

    const pencil = new PencilTool();
    pencil.onPointerDown(
      { offsetX: 0, offsetY: 0, clientX: 0, clientY: 0 } as PointerEvent,
      editor,
    );
    expect(ctx.strokeStyle).toBe("#111111");

    colorPicker.value = "#ff0000";
    pencil.onPointerDown(
      { offsetX: 1, offsetY: 1, clientX: 1, clientY: 1 } as PointerEvent,
      editor,
    );
    expect(ctx.strokeStyle).toBe("#ff0000");

    const fillMode = document.getElementById("fillMode") as HTMLInputElement;
    fillMode.checked = true;
    colorPicker.value = "#00ff00";
    const rect = new RectangleTool();
    rect.onPointerDown(
      { offsetX: 0, offsetY: 0, clientX: 0, clientY: 0 } as PointerEvent,
      editor,
    );
    rect.onPointerUp(
      { offsetX: 2, offsetY: 2, clientX: 2, clientY: 2 } as PointerEvent,
      editor,
    );
    expect(ctx.strokeStyle).toBe("#00ff00");
    expect(ctx.fillStyle).toBe("#00ff00");
  });
});
