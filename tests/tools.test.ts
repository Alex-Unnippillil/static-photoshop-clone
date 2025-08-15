import { Editor } from "../src/core/Editor";
import { PencilTool } from "../src/tools/PencilTool";
import { LineTool } from "../src/tools/LineTool";
import { CircleTool } from "../src/tools/CircleTool";
import { TextTool } from "../src/tools/TextTool";

describe("additional tools", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      fillText: jest.fn(),
      closePath: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
      getImageData: jest.fn().mockReturnValue({} as ImageData),
      putImageData: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  it("pencil draws lines", () => {
    const tool = new PencilTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerMove(
      { offsetX: 5, offsetY: 5, buttons: 1 } as PointerEvent,
      editor,
    );
    tool.onPointerUp({ offsetX: 5, offsetY: 5 } as PointerEvent, editor);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.lineTo).toHaveBeenCalledWith(5, 5);
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it("line tool draws a line", () => {
    const tool = new LineTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 3, offsetY: 4 } as PointerEvent, editor);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(3, 4);
  });

  it("circle tool draws a circle", () => {
    const tool = new CircleTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 3, offsetY: 4 } as PointerEvent, editor);
    expect(ctx.arc).toHaveBeenCalledWith(0, 0, 5, 0, Math.PI * 2);
  });

  it("text tool commits text on Enter", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hi";
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(ctx.fillText).toHaveBeenCalledWith("Hi", 1, 2);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("text tool commits text on blur", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Blur";
    textarea.dispatchEvent(new Event("blur"));
    expect(ctx.fillText).toHaveBeenCalledWith("Blur", 1, 2);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("text tool cancels on Escape", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hi";
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(document.querySelector("textarea")).toBeNull();
  });
});
