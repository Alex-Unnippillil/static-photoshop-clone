import { Editor } from "../src/core/Editor.js";
import { SprayTool } from "../src/tools/SprayTool.js";

describe("SprayTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D> & {
    fillRect: jest.Mock;
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
  };

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#ff0000" />
      <input id="lineWidth" value="5" />
      <input id="fillMode" type="checkbox" />
    `;
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    ctx = {
      fillRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as any);
    editor = new Editor(
      canvas,
      document.getElementById("colorPicker") as HTMLInputElement,
      document.getElementById("lineWidth") as HTMLInputElement,
      document.getElementById("fillMode") as HTMLInputElement,
    );
  });

  it("sprays dots within the specified radius", () => {
    const tool = new SprayTool();
    jest.spyOn(Math, "random").mockReturnValue(0);
    tool.onPointerDown({ offsetX: 10, offsetY: 10 } as PointerEvent, editor);
    expect(ctx.fillRect).toHaveBeenCalled();
    const [x, y] = (ctx.fillRect as jest.Mock).mock.calls[0];
    const dx = x - 10;
    const dy = y - 10;
    const dist = Math.sqrt(dx * dx + dy * dy);
    expect(dist).toBeLessThanOrEqual(editor.lineWidthValue);
  });

  it("uses editor color and line width for dots", () => {
    const tool = new SprayTool();
    jest.spyOn(Math, "random").mockReturnValue(0);
    tool.onPointerDown({ offsetX: 5, offsetY: 5 } as PointerEvent, editor);
    const [, , w, h] = (ctx.fillRect as jest.Mock).mock.calls[0];
    expect(ctx.fillStyle).toBe(editor.strokeStyle);
    expect(ctx.lineWidth).toBe(editor.lineWidthValue);
    expect(w).toBe(editor.lineWidthValue);
    expect(h).toBe(editor.lineWidthValue);
  });
});

