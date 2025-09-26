import { GradientTool, type GradientConfig } from "../src/tools/GradientTool.js";
import type { GradientStop } from "../src/tools/GradientTool.js";
import type { Editor } from "../src/core/Editor.js";

describe("GradientTool", () => {
  let canvas: HTMLCanvasElement;
  let ctx: any;
  let editor: Editor;
  let notifyChange: jest.Mock;

  const createConfig = (stops: GradientStop[]): GradientConfig => {
    const listeners = new Set<() => void>();
    notifyChange = jest.fn(() => {
      listeners.forEach((listener) => listener());
    });
    return {
      type: "linear",
      stops,
      addListener(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      notifyChange,
    };
  };

  beforeEach(() => {
    document.body.innerHTML = "";
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    Object.defineProperty(canvas, "width", { value: 200, writable: true });
    Object.defineProperty(canvas, "height", { value: 200, writable: true });
    canvas.getBoundingClientRect = () => ({
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      bottom: 200,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const addColorStop = jest.fn();
    ctx = {
      getImageData: jest
        .fn()
        .mockReturnValue({
          data: new Uint8ClampedArray(40000),
          width: 200,
          height: 200,
        } as ImageData),
      putImageData: jest.fn(),
      createLinearGradient: jest.fn(() => ({ addColorStop })),
      createRadialGradient: jest.fn(() => ({ addColorStop })),
      fillRect: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
    };
    editor = { canvas, ctx } as unknown as Editor;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a linear gradient when released", () => {
    const config = createConfig([
      { id: 1, offset: 0, color: "#000000" },
      { id: 2, offset: 1, color: "#ffffff" },
    ]);
    const tool = new GradientTool(config);

    tool.onPointerDown({ offsetX: 10, offsetY: 10 } as PointerEvent, editor);
    tool.onPointerMove(
      { offsetX: 110, offsetY: 10, buttons: 1 } as PointerEvent,
      editor,
    );
    tool.onPointerUp({ offsetX: 110, offsetY: 10 } as PointerEvent, editor);

    expect(ctx.createLinearGradient).toHaveBeenCalledWith(10, 10, 110, 10);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 200, 200);
    const gradient = ctx.createLinearGradient.mock.results[0].value;
    expect(gradient.addColorStop).toHaveBeenCalledWith(0, "#000000");
    expect(gradient.addColorStop).toHaveBeenCalledWith(1, "#ffffff");
  });

  it("allows dragging stops to update the gradient", () => {
    const stops: GradientStop[] = [
      { id: 1, offset: 0, color: "#000000" },
      { id: 2, offset: 0.5, color: "#ff0000" },
      { id: 3, offset: 1, color: "#ffffff" },
    ];
    const config = createConfig(stops);
    const tool = new GradientTool(config);

    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerMove({ offsetX: 100, offsetY: 0, buttons: 1 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 100, offsetY: 0 } as PointerEvent, editor);

    ctx.putImageData.mockClear();
    ctx.fillRect.mockClear();
    notifyChange.mockClear();

    tool.onPointerDown({ offsetX: 50, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerMove({ offsetX: 150, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 150, offsetY: 0 } as PointerEvent, editor);

    expect(ctx.putImageData).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(stops[1].offset).toBeGreaterThan(0.5);
    expect(stops[1].offset).toBeLessThanOrEqual(1);
    expect(notifyChange).toHaveBeenCalled();
  });

  it("supports radial gradients", () => {
    const config = createConfig([
      { id: 1, offset: 0, color: "#000000" },
      { id: 2, offset: 1, color: "#ffffff" },
    ]);
    config.type = "radial";
    const tool = new GradientTool(config);

    tool.onPointerDown({ offsetX: 30, offsetY: 40 } as PointerEvent, editor);
    tool.onPointerMove(
      { offsetX: 80, offsetY: 90, buttons: 1 } as PointerEvent,
      editor,
    );
    tool.onPointerUp({ offsetX: 80, offsetY: 90 } as PointerEvent, editor);

    expect(ctx.createRadialGradient).toHaveBeenCalled();
  });
});
