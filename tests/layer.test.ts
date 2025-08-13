import { Editor } from "../src/core/Editor";
import { PencilTool } from "../src/tools/PencilTool";

describe("layer drawing", () => {
  let canvas: HTMLCanvasElement;
  let contexts: Array<Partial<CanvasRenderingContext2D>> = [];
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="1" />
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
    editor.setTool(new PencilTool());
    editor.addLayer();
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

  it("draws only on the active layer", () => {
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointermove", 5, 5, 1);
    dispatch("pointerup", 5, 5, 0);

    const layer0 = contexts[1];
    const layer1 = contexts[2];
    expect(layer1.beginPath).toHaveBeenCalled();
    expect(layer0.beginPath).not.toHaveBeenCalled();

    editor.setActiveLayer(0);
    dispatch("pointerdown", 1, 1, 1);
    dispatch("pointermove", 2, 2, 1);
    dispatch("pointerup", 2, 2, 0);

    expect(layer0.beginPath).toHaveBeenCalled();
    expect(layer1.beginPath).toHaveBeenCalledTimes(1);
  });
});

