import { Editor } from "../src/core/Editor.js";
import { LassoTool } from "../src/tools/LassoTool.js";

describe("LassoTool", () => {
  let canvas: HTMLCanvasElement;
  let editor: Editor;
  let tool: LassoTool;
  const width = 100;
  const height = 100;
  let maskData: Uint8ClampedArray;
  let createElementSpy: jest.SpyInstance;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
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
      toJSON: () => {},
    });
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();

    const baseImage = {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    } as ImageData;

    const ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
      getImageData: jest.fn(() => baseImage),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    } as unknown as CanvasRenderingContext2D;

    canvas.getContext = jest.fn(() => ctx);

    const originalCreateElement = document.createElement.bind(document);
    maskData = new Uint8ClampedArray(width * height * 4);
    for (let y = 10; y < 20; y += 1) {
      for (let x = 10; x < 20; x += 1) {
        maskData[(y * width + x) * 4 + 3] = 255;
      }
    }

    const overlayCtx = {
      clearRect: jest.fn(),
      setLineDash: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      lineWidth: 1,
      strokeStyle: "",
      fillStyle: "",
    } as unknown as CanvasRenderingContext2D;

    const maskCtx = {
      fillStyle: "",
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      getImageData: jest.fn(
        () => ({ data: maskData, width, height } as ImageData),
      ),
    } as unknown as CanvasRenderingContext2D;

    let overlayProvided = false;
    createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        if (tagName.toLowerCase() === "canvas") {
          const el = originalCreateElement(tagName) as HTMLCanvasElement;
          el.width = width;
          el.height = height;
          el.getContext = jest
            .fn()
            .mockReturnValue(overlayProvided ? maskCtx : overlayCtx);
          overlayProvided = true;
          return el as unknown as HTMLElement;
        }
        return originalCreateElement(tagName);
      });

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
    tool = new LassoTool();
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    editor.destroy();
  });

  function drawSimplePolygon() {
    tool.onPointerDown(
      { clientX: 10, clientY: 10 } as PointerEvent,
      editor,
    );
    tool.onPointerMove(
      { clientX: 60, clientY: 10, buttons: 1 } as PointerEvent,
      editor,
    );
    tool.onPointerMove(
      { clientX: 35, clientY: 40, buttons: 1 } as PointerEvent,
      editor,
    );
    tool.onPointerUp({ clientX: 35, clientY: 40 } as PointerEvent, editor);
  }

  it("commits a selection mask when closed and committed", () => {
    drawSimplePolygon();
    tool.closePath();
    tool.commitSelection();

    expect(editor.selectionMask).not.toBeNull();
    expect(editor.selectionMask?.bounds).toEqual({
      x: 10,
      y: 10,
      width: 10,
      height: 10,
    });
    expect(tool.state.hasSelection).toBe(true);
  });

  it("clears selection on cancel", () => {
    drawSimplePolygon();
    tool.closePath();
    tool.commitSelection();
    expect(editor.selectionMask).not.toBeNull();

    tool.cancelSelection();
    expect(editor.selectionMask).toBeNull();
    expect(tool.state.hasSelection).toBe(false);
  });
});
