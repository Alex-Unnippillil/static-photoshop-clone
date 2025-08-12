import { Editor } from "../src/core/Editor";
import { PencilTool } from "../src/tools/PencilTool";

class TestPointerEvent extends MouseEvent {
  constructor(type: string, props?: any) {
    super(type, props);
  }
}

(global as any).PointerEvent = TestPointerEvent;

describe("Editor", () => {
  let canvas: HTMLCanvasElement;
  let ctx: any;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;

    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({}),
      putImageData: jest.fn(),
    };

    canvas.getContext = jest.fn().mockReturnValue(ctx);
    canvas.toDataURL = jest.fn().mockReturnValue("data:image/png;base64,TEST");

    (global as any).Image = class {
      onload: () => void = () => {};
      set src(_src: string) {
        setTimeout(() => this.onload(), 0);
      }
    };

    const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
    const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

    editor = new Editor(canvas, colorPicker, lineWidth);
    editor.setTool(new PencilTool());
  });

  function dispatch(type: string, x: number, y: number, init: PointerEventInit = {}) {
    const event = new PointerEvent(type, { bubbles: true, ...init });
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    canvas.dispatchEvent(event);
  }

  it("draws and supports undo/redo", async () => {
    dispatch("pointerdown", 0, 0, { button: 0 });
    dispatch("pointermove", 10, 10, { buttons: 1 });
    dispatch("pointerup", 10, 10);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.closePath).toHaveBeenCalled();

    editor.undo();
    await new Promise((r) => setTimeout(r, 0));
    const undoCalls = ctx.putImageData.mock.calls.length || ctx.drawImage.mock.calls.length;
    expect(undoCalls).toBe(1);

    editor.redo();
    await new Promise((r) => setTimeout(r, 0));
    const redoCalls = ctx.putImageData.mock.calls.length || ctx.drawImage.mock.calls.length;
    expect(redoCalls).toBe(2);
  });
});

