import { Editor } from "../src/core/Editor";
import { TextTool } from "../src/tools/TextTool";

describe("TextTool", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container"><canvas id="canvas"></canvas></div>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      fillText: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
    );
  });

  it("renders text on Enter and cleans up overlay", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 1, offsetY: 2 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    textarea.value = "Hi";
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(ctx.fillText).toHaveBeenCalledWith("Hi", 1, 2);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("renders text on blur and cleans up overlay", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 3, offsetY: 4 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    textarea.value = "Blur";
    textarea.dispatchEvent(new Event("blur"));
    expect(ctx.fillText).toHaveBeenCalledWith("Blur", 3, 4);
    expect(document.querySelector("textarea")).toBeNull();
  });
});

