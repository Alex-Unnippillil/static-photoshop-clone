import { Editor } from "../src/core/Editor.js";
import { EyedropperTool } from "../src/tools/EyedropperTool.js";
import { initEditor, type EditorHandle } from "../src/editor.js";

describe("EyedropperTool", () => {
  let canvas: HTMLCanvasElement;
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="1" />
      <input id="fillMode" type="checkbox" />
      <div id="colorHistory"></div>
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const image = { data: new Uint8ClampedArray([12, 34, 56, 255]) } as ImageData;
    ctx = {
      getImageData: jest.fn(() => image),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.getBoundingClientRect = () => ({
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
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

  it("updates the color picker based on canvas pixel", () => {
    const tool = new EyedropperTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);
    expect(editor.colorPicker.value).toBe("#0c2238");
  });

  it("updates the color history when the color picker changes", () => {
    const tool = new EyedropperTool();
    const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
    const colorHistory = document.getElementById("colorHistory") as HTMLDivElement;

    const recentColors: string[] = [];
    const renderColorHistory = () => {
      colorHistory.innerHTML = "";
      recentColors.forEach((color) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "color-swatch";
        btn.style.backgroundColor = color;
        btn.setAttribute("aria-label", `Select ${color}`);
        colorHistory.appendChild(btn);
      });
    };
    const recordColor = (color: string) => {
      const existing = recentColors.indexOf(color);
      if (existing !== -1) recentColors.splice(existing, 1);
      recentColors.unshift(color);
      if (recentColors.length > 10) recentColors.pop();
      renderColorHistory();
    };
    colorPicker.addEventListener("input", () => {
      recordColor(colorPicker.value);
    });

    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, editor);

    expect(recentColors[0]).toBe("#0c2238");
    expect(colorHistory.children).toHaveLength(1);
    const swatch = colorHistory.children[0] as HTMLElement;
    expect(swatch.style.backgroundColor).toBe("rgb(12, 34, 56)");
  });
});

describe("EyedropperTool color history", () => {
  let handle: EditorHandle;
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="1" />
      <input id="fillMode" type="checkbox" />

      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>
      <button id="bucket"></button>
      <button id="eyedropper"></button>

      <select id="formatSelect"><option value="png">PNG</option></select>
      <button id="save"></button>
      <div id="colorHistory"></div>
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const image = { data: new Uint8ClampedArray([12, 34, 56, 255]) } as ImageData;
    ctx = {
      getImageData: jest.fn(() => image),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.getBoundingClientRect = () => ({
      width: 0,
      height: 0,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    handle = initEditor();
  });

  afterEach(() => {
    handle.destroy();
  });

  it("records sampled colors in the color history", () => {
    const history = document.getElementById("colorHistory") as HTMLDivElement;
    expect(history.children).toHaveLength(1);
    const tool = new EyedropperTool();
    tool.onPointerDown({ offsetX: 0, offsetY: 0 } as PointerEvent, handle.editor);
    expect(history.children).toHaveLength(2);
    const swatch = history.children[0] as HTMLButtonElement;
    expect(swatch.style.backgroundColor).toBe("rgb(12, 34, 56)");
  });

  it("sets tooltip labels for color history swatches", () => {
    const history = document.getElementById("colorHistory") as HTMLDivElement;
    const swatch = history.querySelector<HTMLButtonElement>(".color-swatch");
    expect(swatch).not.toBeNull();
    expect(swatch?.title).toBe("#000000");
  });

  it("supports arrow key navigation with roving tab indexes", () => {
    const history = document.getElementById("colorHistory") as HTMLDivElement;
    const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;

    colorPicker.value = "#112233";
    colorPicker.dispatchEvent(new Event("input", { bubbles: true }));

    const swatches = history.querySelectorAll<HTMLButtonElement>(".color-swatch");
    expect(swatches).toHaveLength(2);
    expect(swatches[0].tabIndex).toBe(0);
    expect(swatches[1].tabIndex).toBe(-1);

    swatches[0].focus();
    swatches[0].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(document.activeElement).toBe(swatches[1]);
    expect(swatches[0].tabIndex).toBe(-1);
    expect(swatches[1].tabIndex).toBe(0);

    swatches[1].dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(document.activeElement).toBe(swatches[0]);
    expect(swatches[0].tabIndex).toBe(0);
    expect(swatches[1].tabIndex).toBe(-1);
  });
});

