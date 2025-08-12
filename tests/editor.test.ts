import { initEditor } from "../src/editor";

describe("editor", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="imageLoader" />
      <button id="save"></button>
      <button id="undo"></button>
      <button id="redo"></button>
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;

    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      clearRect: jest.fn(),
      putImageData: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(),
        width: 1,
        height: 1,
      } as ImageData)),
      arc: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      scale: jest.fn(),
    };

    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    initEditor();
  });

  function dispatch(type: string, x: number, y: number, buttons = 0) {
    const event = new MouseEvent(type, { bubbles: true } as MouseEventInit);
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Object.defineProperty(event, "buttons", { value: buttons });
    canvas.dispatchEvent(event);
  }

  it("draws and supports undo/redo", async () => {
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointermove", 10, 10, 1);
    dispatch("pointerup", 10, 10, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.stroke).toHaveBeenCalled();

    (document.getElementById("undo") as HTMLButtonElement).click();
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    (document.getElementById("redo") as HTMLButtonElement).click();
    expect(ctx.putImageData).toHaveBeenCalledTimes(2);
  });
});
