import { Editor } from "../src/core/Editor";
import { PencilTool } from "../src/tools/PencilTool";
import { LineTool } from "../src/tools/LineTool";
import { CircleTool } from "../src/tools/CircleTool";
import { RectangleTool } from "../src/tools/RectangleTool";
import { TextTool } from "../src/tools/TextTool";
import { EraserTool } from "../src/tools/EraserTool";

describe("editor", () => {
  let canvas: HTMLCanvasElement;
  let ctx: any;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="imageLoader" />
      <button id="save"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.getBoundingClientRect = () => ({ width: 100, height: 100 } as DOMRect);

    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      drawImage: jest.fn(),
      arc: jest.fn(),
      fillText: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest
        .fn()
        .mockReturnValue({ data: new Uint8ClampedArray(), width: 100, height: 100 } as unknown as ImageData),
      putImageData: jest.fn(),
      scale: jest.fn(),
      globalCompositeOperation: "source-over",
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.toDataURL = jest.fn();

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
    );
    editor.setTool(new PencilTool());

    document
      .getElementById("save")!
      .addEventListener("click", () => canvas.toDataURL("image/png"));

    const readSpy = jest.fn().mockImplementation(function (this: MockFileReader) {
      this.result = "data:image/png;base64,LOAD";
      this.onload && this.onload(new Event("load"));
    });
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((ev: Event) => any) | null = null;
      readAsDataURL = readSpy;
    }
    (global as any).FileReader = jest.fn(() => new MockFileReader());
    class MockImage {
      onload: () => void = () => {};
      set src(_s: string) {
        this.onload();
      }
    }
    (global as any).Image = MockImage;
  });

  function dispatch(type: string, x: number, y: number, buttons = 0) {
    const event = new MouseEvent(type, { bubbles: true } as MouseEventInit);
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

  it("calls toDataURL when Save is clicked", () => {
    (document.getElementById("save") as HTMLButtonElement).click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
  });

  it("draws a line", () => {
    editor.setTool(new LineTool());
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointerup", 5, 5, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(5, 5);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws a circle", () => {
    editor.setTool(new CircleTool());
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointerup", 3, 4, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledWith(0, 0, 5, 0, Math.PI * 2);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws text", () => {
    editor.setTool(new TextTool());
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("Hello");
    dispatch("pointerdown", 10, 20, 1);

    expect(promptSpy).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith("Hello", 10, 20);
    promptSpy.mockRestore();
  });

  it("erases using destination-out compositing", () => {
    editor.setTool(new EraserTool());
    dispatch("pointerdown", 5, 5, 1);
    dispatch("pointermove", 6, 6, 1);

    expect(ctx.globalCompositeOperation).toBe("destination-out");

    dispatch("pointerup", 6, 6, 0);

    expect(ctx.globalCompositeOperation).toBe("source-over");
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("previews rectangle during pointer move", () => {
    editor.setTool(new RectangleTool());
    dispatch("pointerdown", 1, 1, 1);
    dispatch("pointermove", 3, 3, 1);

    expect(ctx.getImageData).toHaveBeenCalled();
    const imageData = (ctx.getImageData as jest.Mock).mock.results[0].value;
    expect(ctx.putImageData).toHaveBeenCalledWith(imageData, 0, 0);
    expect(ctx.strokeRect).toHaveBeenCalledWith(1, 1, 2, 2);
  });
});
