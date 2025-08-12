import { Editor } from "../src/core/Editor";
import { PencilTool } from "../src/tools/PencilTool";

describe("editor", () => {
  let canvas: HTMLCanvasElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ctx: any;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas" width="100" height="100"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
    const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

    const imageData = { width: 100, height: 100, data: new Uint8ClampedArray() } as ImageData;
    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => imageData),
      putImageData: jest.fn(),
    };

    canvas.getContext = jest.fn().mockReturnValue(ctx);

    editor = new Editor(canvas, colorPicker, lineWidth);
    editor.setTool(new PencilTool());
  });

  function dispatch(type: string, x: number, y: number, buttons = 0) {
    const event = new MouseEvent(type, { bubbles: true });
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Object.defineProperty(event, "buttons", { value: buttons });
    canvas.dispatchEvent(event);
  }

  it("draws and supports undo/redo", () => {
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointermove", 10, 10, 1);
    dispatch("pointerup", 10, 10, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.stroke).toHaveBeenCalled();

    editor.undo();
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    editor.redo();
    expect(ctx.putImageData).toHaveBeenCalledTimes(2);
  });
});
