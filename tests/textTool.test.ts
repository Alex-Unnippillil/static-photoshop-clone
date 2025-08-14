import { Editor } from "../src/core/Editor";
import { TextTool } from "../src/tools/TextTool";

describe("TextTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container">
        <canvas id="canvas"></canvas>
      </div>
      <input id="colorPicker" value="#123456" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const container = document.getElementById("container") as HTMLElement;

    ctx = {
      fillText: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };

    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    container.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  afterEach(() => {
    editor.destroy();
  });

  it("creates textarea overlay on pointer down", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent, editor);
    const ta = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(ta).toBeTruthy();
    expect(ta.style.left).toBe("10px");
    expect(ta.style.top).toBe("20px");
    const hexToRgb = (hex: string) => {
      const v = hex.replace("#", "");
      const r = parseInt(v.substring(0, 2), 16);
      const g = parseInt(v.substring(2, 4), 16);
      const b = parseInt(v.substring(4, 6), 16);
      return `rgb(${r}, ${g}, ${b})`;
    };
    expect(ta.style.color).toBe(hexToRgb(editor.strokeStyle));
    expect(ta.style.fontSize).toBe(`${editor.lineWidthValue * 4}px`);
  });

  it("commits text on Enter", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 5, offsetY: 6 } as PointerEvent, editor);
    const ta = document.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "hello";
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(ctx.fillText).toHaveBeenCalledWith("hello", 5, 6);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("cancels text on Escape", () => {
    const tool = new TextTool();
    tool.onPointerDown({ offsetX: 7, offsetY: 8 } as PointerEvent, editor);
    const ta = document.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "cancel";
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(document.querySelector("textarea")).toBeNull();
  });
});

