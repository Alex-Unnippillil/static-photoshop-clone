import { initEditor, type EditorHandle } from "../src/editor.js";

describe("clear button", () => {
  let handle: EditorHandle;
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toolbar">
        <input id="colorPicker" value="#000000" />
        <input id="lineWidth" value="2" />
        <input id="fillMode" type="checkbox" />
        <button id="pencil"></button>
        <button id="eraser"></button>
        <button id="rectangle"></button>
        <button id="line"></button>
        <button id="circle"></button>
        <button id="text"></button>
        <button id="eyedropper"></button>
        <button id="bucket"></button>
        <select id="formatSelect"><option value="png">PNG</option></select>
        <button id="save"></button>
        <button id="undo"></button>
        <button id="redo"></button>
        <button id="clear"></button>
      </div>
      <canvas id="canvas"></canvas>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const mockImage = { data: new Uint8ClampedArray(), width: 100, height: 100 } as ImageData;
    ctx = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      getImageData: jest.fn(() => mockImage),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
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

    handle = initEditor();
  });

  afterEach(() => {
    handle.destroy();
  });

  it("clears canvas and saves state", () => {
    const btn = document.getElementById("clear") as HTMLButtonElement;
    expect(handle.editor.canUndo).toBe(false);
    btn.click();
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    expect(handle.editor.canUndo).toBe(true);
  });
});
