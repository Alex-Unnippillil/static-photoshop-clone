import { initEditor } from "../src/editor";

describe("editor", () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="imageLoader" />
      <button id="undo"></button>
      <button id="redo"></button>
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;

    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      arc: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      closePath: jest.fn(),
      strokeStyle: "#000000",
    } as unknown as CanvasRenderingContext2D;

    canvas.getContext = jest.fn().mockReturnValue(ctx);
    canvas.toDataURL = jest.fn().mockReturnValue("data:image/png;base64,TEST");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).Image = class {
      onload: () => void = () => {};
      set src(_src: string) {
        setTimeout(() => this.onload(), 0);
      }
    };

    initEditor();
  });

  function dispatch(type: string, x: number, y: number, buttons = 1) {
    const event = new MouseEvent(type, { bubbles: true } as MouseEventInit);
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Object.defineProperty(event, "buttons", { value: buttons });
    canvas.dispatchEvent(event);
  }

  it("draws and supports undo/redo", async () => {
    dispatch("pointerdown", 0, 0);
    dispatch("pointermove", 10, 10);
    dispatch("pointerup", 10, 10, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.stroke).toHaveBeenCalled();

    (document.getElementById("undo") as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);

    (document.getElementById("redo") as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
  });

  it("uses white stroke when erasing", () => {
    (document.getElementById("eraser") as HTMLButtonElement).click();
    dispatch("pointerdown", 0, 0);
    dispatch("pointermove", 10, 10);
    dispatch("pointerup", 10, 10, 0);
    expect(ctx.strokeStyle).toBe("#ffffff");
  });
});
