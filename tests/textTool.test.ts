import { Editor } from "../src/core/Editor";
import { TextTool } from "../src/tools/TextTool";

describe("text tool overlay", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <canvas id="canvas"></canvas>
      </div>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      fillText: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
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
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
    );
  });

  afterEach(() => {
    editor.destroy();
  });

  it("creates a textarea on pointer down", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 15 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.style.left).toBe("10px");
    expect(textarea.style.top).toBe("15px");
  });

  it("renders text on enter and removes the textarea", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hello";
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(ctx.fillText).toHaveBeenCalledWith("Hello", 10, 20);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("removes textarea on escape without drawing", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 5, offsetY: 6 } as PointerEvent, editor);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hi";
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(document.querySelector("textarea")).toBeNull();
  });
});
