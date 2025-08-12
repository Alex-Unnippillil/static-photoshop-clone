import { initEditor } from "../src/editor";
import { Editor } from "../src/core/Editor";

describe("editor integration", () => {
  let canvas: HTMLCanvasElement;


  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
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

    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
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



    editor = initEditor();
  });

  function dispatch(type: string, x: number, y: number, buttons = 0) {
    const event = new MouseEvent(type, { bubbles: true } as MouseEventInit);
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Object.defineProperty(event, "buttons", { value: buttons });
    canvas.dispatchEvent(event);
  }


    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointermove", 5, 5, 1);
    dispatch("pointerup", 5, 5, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(5, 5);
    expect(ctx.stroke).toHaveBeenCalled();
  });

    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it("previews rectangle during pointer move", () => {
    (document.getElementById("rectangle") as HTMLButtonElement).click();
    dispatch("pointerdown", 1, 1, 1);
    dispatch("pointermove", 3, 3, 1);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalledWith(1, 1, 2, 2);
  });
});
