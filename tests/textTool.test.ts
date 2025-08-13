import { Editor } from "../src/core/Editor";
import { TextTool } from "../src/tools/TextTool";

describe("TextTool", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#ff0000" />
      <input id="lineWidth" value="3" />
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      fillText: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
    );
  });

  it("renders text on blur and removes overlay", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    textarea.value = "Hello";
    textarea.dispatchEvent(new Event("blur"));
    expect(ctx.fillText).toHaveBeenCalledWith("Hello", 1, 2);
    expect(document.querySelector("textarea")).toBeNull();
    expect(ctx.fillStyle).toBe("#ff0000");
    expect(ctx.font).toBe(`${editor.lineWidthValue * 4}px sans-serif`);
  });

  it("renders text on enter key and removes overlay", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 3, offsetY: 4 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hi";
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(ctx.fillText).toHaveBeenCalledWith("Hi", 3, 4);
    expect(document.querySelector("textarea")).toBeNull();
  });
});
