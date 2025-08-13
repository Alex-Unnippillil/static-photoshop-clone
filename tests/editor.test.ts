import { Editor } from "../src/core/Editor";
import { PencilTool } from "../src/tools/PencilTool";
import { EraserTool } from "../src/tools/EraserTool";
import { RectangleTool } from "../src/tools/RectangleTool";

describe("editor integration", () => {
  let canvas: HTMLCanvasElement;
  let contexts: Array<Partial<CanvasRenderingContext2D>> = [];
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="undo"></button>
      <button id="redo"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const mockImage = {
      data: new Uint8ClampedArray(),
      width: 100,
      height: 100,
    } as ImageData;

    contexts = [];
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation(() => {
        const ctx = {
          beginPath: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          stroke: jest.fn(),
          closePath: jest.fn(),
          clearRect: jest.fn(),
          getImageData: jest.fn(() => mockImage),
          putImageData: jest.fn(),
          strokeRect: jest.fn(),
          drawImage: jest.fn(),
          setTransform: jest.fn(),
          scale: jest.fn(),
        } as Partial<CanvasRenderingContext2D>;
        contexts.push(ctx);
        return ctx as CanvasRenderingContext2D;
      });

    canvas.toDataURL = jest.fn();
    canvas.getBoundingClientRect = () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
    );

    (document.getElementById("pencil") as HTMLButtonElement).addEventListener(
      "click",
      () => editor.setTool(new PencilTool()),
    );
    (document.getElementById("eraser") as HTMLButtonElement).addEventListener(
      "click",
      () => editor.setTool(new EraserTool()),
    );
    (document.getElementById("rectangle") as HTMLButtonElement).addEventListener(
      "click",
      () => editor.setTool(new RectangleTool()),
    );
    (document.getElementById("undo") as HTMLButtonElement).addEventListener(
      "click",
      () => editor.undo(),
    );
    (document.getElementById("redo") as HTMLButtonElement).addEventListener(
      "click",
      () => editor.redo(),
    );
  });

  afterEach(() => {
    editor.destroy();
    jest.restoreAllMocks();
  });

  function dispatch(type: string, x: number, y: number, buttons = 0) {
    const event = new MouseEvent(type, { bubbles: true } as MouseEventInit);
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Object.defineProperty(event, "buttons", { value: buttons });
    canvas.dispatchEvent(event);
  }

  it("draws with pencil tool and supports undo/redo", () => {
    (document.getElementById("pencil") as HTMLButtonElement).click();
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointermove", 5, 5, 1);
    dispatch("pointerup", 5, 5, 0);

    const layerCtx = contexts[1];
    const mainCtx = contexts[0];

    expect(layerCtx.beginPath).toHaveBeenCalled();
    expect(layerCtx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(layerCtx.lineTo).toHaveBeenCalledWith(5, 5);
    expect(layerCtx.stroke).toHaveBeenCalled();

    const clearBeforeUndo = (mainCtx.clearRect as jest.Mock).mock.calls.length;
    (document.getElementById("undo") as HTMLButtonElement).click();
    expect((mainCtx.clearRect as jest.Mock).mock.calls.length).toBe(
      clearBeforeUndo + 2,
    );
    expect(mainCtx.putImageData).toHaveBeenCalledTimes(1);

    const clearBeforeRedo = (mainCtx.clearRect as jest.Mock).mock.calls.length;
    (document.getElementById("redo") as HTMLButtonElement).click();
    expect((mainCtx.clearRect as jest.Mock).mock.calls.length).toBe(
      clearBeforeRedo + 2,
    );
    expect(mainCtx.putImageData).toHaveBeenCalledTimes(2);
  });

  it("uses eraser tool to clear", () => {
    (document.getElementById("eraser") as HTMLButtonElement).click();
    dispatch("pointerdown", 2, 2, 1);
    dispatch("pointermove", 4, 4, 1);
    const layerCtx = contexts[1];
    expect(layerCtx.clearRect).toHaveBeenCalled();
  });

  it("previews rectangle during pointer move", () => {
    (document.getElementById("rectangle") as HTMLButtonElement).click();
    dispatch("pointerdown", 1, 1, 1);
    dispatch("pointermove", 3, 4, 1);
    const layerCtx = contexts[1];
    expect(layerCtx.getImageData).toHaveBeenCalled();
    expect(layerCtx.putImageData).toHaveBeenCalled();
    expect(layerCtx.strokeRect).toHaveBeenCalledWith(1, 1, 2, 3);
  });
});

