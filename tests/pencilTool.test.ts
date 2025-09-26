import { Editor } from "../src/core/Editor.js";
import { PencilTool } from "../src/tools/PencilTool.js";

describe("PencilTool smoothing", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D> & {
    lineTo: jest.Mock;
    moveTo: jest.Mock;
    beginPath: jest.Mock;
    stroke: jest.Mock;
    closePath: jest.Mock;
  };
  let rafSpy: jest.SpyInstance<number, [FrameRequestCallback]>;
  let cancelSpy: jest.SpyInstance<void, [number]>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const rect = {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    } as DOMRect;
    canvas.getBoundingClientRect = () => rect;
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
      setTransform: jest.fn(),
      scale: jest.fn(),
      lineWidth: 1,
      strokeStyle: "#000000",
      fillStyle: "#000000",
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);

    rafSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
    cancelSpy = jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  it("applies weighted moving average smoothing", () => {
    const tool = new PencilTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerMove({ offsetX: 10, offsetY: 0, buttons: 1 } as PointerEvent, editor);
    tool.onPointerMove({ offsetX: 20, offsetY: 0, buttons: 1 } as PointerEvent, editor);
    tool.onPointerMove({ offsetX: 30, offsetY: 0, buttons: 1 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 30, offsetY: 0 } as PointerEvent, editor);

    const calls = (ctx.lineTo as jest.Mock).mock.calls;
    expect(calls.length).toBe(4);
    const smoothedCalls = calls.slice(1);
    expect(smoothedCalls[0][0]).toBeCloseTo(6.25, 2);
    expect(smoothedCalls[1][0]).toBeCloseTo(13.68, 2);
    expect(smoothedCalls[2][0]).toBeCloseTo(22.5, 2);
    smoothedCalls.forEach(([, y]: number[]) => expect(y).toBeCloseTo(0, 5));
  });

  it("buffers pointer events until the next animation frame flush", () => {
    const callbacks: jest.Mock[] = [];
    rafSpy.mockImplementation((cb: FrameRequestCallback) => {
      const wrapper = jest.fn(cb);
      callbacks.push(wrapper);
      return callbacks.length;
    });

    const tool = new PencilTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerMove({ offsetX: 10, offsetY: 0, buttons: 1 } as PointerEvent, editor);
    tool.onPointerMove({ offsetX: 20, offsetY: 0, buttons: 1 } as PointerEvent, editor);

    // Only the initial dot should be rendered before the frame callback runs.
    expect((ctx.lineTo as jest.Mock).mock.calls.length).toBe(1);

    tool.onPointerUp({ offsetX: 20, offsetY: 0 } as PointerEvent, editor);
    expect(cancelSpy).toHaveBeenCalled();
    expect((ctx.lineTo as jest.Mock).mock.calls.length).toBe(3);

    // The scheduled callbacks should not have been invoked once cancelled.
    callbacks.forEach((cb) => expect(cb).not.toHaveBeenCalled());
  });
});
