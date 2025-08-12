import { initEditor } from "../src/editor";

describe("editor", () => {
  let canvas: HTMLCanvasElement;
  let ctx: any;

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
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      arc: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
    };

    canvas.getContext = jest.fn().mockReturnValue(ctx);
    canvas.toDataURL = jest.fn().mockReturnValue("data:image/png;base64,TEST");

    (global as any).Image = class {
      onload: () => void = () => {};
      set src(_src: string) {
        setTimeout(() => this.onload(), 0);
      }
    };

    initEditor();
  });

  function dispatch(type: string, x: number, y: number) {
    const event = new MouseEvent(type, { bubbles: true } as MouseEventInit);
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    canvas.dispatchEvent(event);
  }

  it("draws and supports undo/redo", async () => {
    dispatch("mousedown", 0, 0);
    dispatch("mousemove", 10, 10);
    dispatch("mouseup", 10, 10);

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
});
