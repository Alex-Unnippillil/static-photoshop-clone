import { Editor } from "../src/core/Editor";
import { TextTool } from "../src/tools/TextTool";

describe("text tool overlay", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor;
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <canvas id="canvas" tabindex="0"></canvas>
      </div>
      <input id="colorPicker" value="#ff0000" />
      <input id="lineWidth" value="2" />
    `;
    container = document.getElementById("container") as HTMLElement;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      fillText: jest.fn(),
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

  it("creates a textarea overlay with correct style", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent, editor);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.style.color).toBe("#ff0000");
    expect(textarea.style.fontSize).toBe("8px");
    expect(document.activeElement).toBe(textarea);
  });

  it("renders text on Enter and cleans up", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent, editor);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hi";
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(ctx.fillText).toHaveBeenCalledWith("Hi", 10, 20);
    expect(container.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(canvas);
  });

  it("renders text on blur and cleans up", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent, editor);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hi";
    textarea.dispatchEvent(new Event("blur"));
    expect(ctx.fillText).toHaveBeenCalledWith("Hi", 10, 20);
    expect(container.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(canvas);
  });

  it("cancels on Escape", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent, editor);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "Hi";
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(container.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(canvas);
  });
});

