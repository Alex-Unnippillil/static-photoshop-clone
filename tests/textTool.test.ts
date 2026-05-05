import { Editor } from "../src/core/Editor.js";
import { TextTool } from "../src/tools/TextTool.js";

describe("TextTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;
  let canvas: HTMLCanvasElement;
  let mockImage: ImageData;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container" style="position: static;">
        <canvas id="canvas"></canvas>
      </div>
      <input id="colorPicker" value="#123456" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <select id="fontFamily"><option value="serif">serif</option></select>
      <input id="fontSize" value="20" />
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    const container = document.getElementById("container") as HTMLElement;

    mockImage = {
      data: new Uint8ClampedArray(),
      width: 1,
      height: 1,
    } as ImageData;

    ctx = {
      fillText: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => mockImage),
      putImageData: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };

    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      right: 200,
      bottom: 150,
      width: 100,
      height: 100,
      x: 100,
      y: 50,
      toJSON: () => {},
    });
    container.getBoundingClientRect = () => ({
      left: 80,
      top: 30,
      right: 280,
      bottom: 230,
      width: 200,
      height: 200,
      x: 80,
      y: 30,
      toJSON: () => {},
    });

    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
      undefined,
      document.getElementById("fontFamily") as HTMLSelectElement,
      document.getElementById("fontSize") as HTMLInputElement,
    );
  });

  afterEach(() => {
    editor.destroy();
  });

  it("positions textarea from canvas rect and scroll inside positioned parent", () => {
    Object.defineProperty(window, "scrollX", { value: 15, configurable: true });
    Object.defineProperty(window, "scrollY", { value: 25, configurable: true });

    const tool = new TextTool();
    tool.onPointerDown(
      { offsetX: 10, offsetY: 20, clientX: 140, clientY: 95 } as PointerEvent,
      editor,
    );
    const ta = document.querySelector("textarea") as HTMLTextAreaElement;
    const container = document.getElementById("container") as HTMLElement;
    expect(container.style.position).toBe("relative");
    expect(ta.style.left).toBe("60px");
    expect(ta.style.top).toBe("65px");
    expect(ta.parentElement).toBe(container);
  });

  it("commits text on Enter and keeps newline behavior for Shift+Enter", () => {
    const tool = new TextTool();
    editor.saveState();
    tool.onPointerDown({ offsetX: 5, offsetY: 6 } as PointerEvent, editor);
    const ta = document.querySelector("textarea") as HTMLTextAreaElement;

    const shiftEnter = new KeyboardEvent("keydown", {
      key: "Enter",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    ta.dispatchEvent(shiftEnter);
    expect(shiftEnter.defaultPrevented).toBe(false);
    expect(ctx.fillText).not.toHaveBeenCalled();

    ta.value = "hello";
    ta.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
    );
    expect(ctx.font).toBe(`${editor.fontSizeValue}px ${editor.fontFamilyValue}`);
    expect(ctx.fillText).toHaveBeenCalledWith("hello", 5, 6);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("cancels text on Escape without committing and drops pending history", () => {
    const tool = new TextTool();
    editor.saveState();
    tool.onPointerDown({ offsetX: 7, offsetY: 8 } as PointerEvent, editor);
    const ta = document.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "cancel";
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(editor.canUndo).toBe(false);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("does not commit empty or unchanged text", () => {
    const tool = new TextTool();

    editor.saveState();
    tool.onPointerDown({ offsetX: 9, offsetY: 10 } as PointerEvent, editor);
    let ta = document.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "   ";
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(editor.canUndo).toBe(false);

    editor.saveState();
    tool.onPointerDown({ offsetX: 9, offsetY: 10 } as PointerEvent, editor);
    ta = document.querySelector("textarea") as HTMLTextAreaElement;
    ta.value = "";
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(ctx.fillText).not.toHaveBeenCalled();
    expect(editor.canUndo).toBe(false);
  });
});
