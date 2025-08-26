import { initEditor, EditorHandle } from "../src/editor.js";
import { BucketFillTool } from "../src/tools/BucketFillTool.js";

describe("bucket tool integration", () => {
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
      <button id="bucket">Bucket</button>
      <button id="eyedropper"></button>
      <select id="formatSelect"><option value="png">PNG</option></select>
      <button id="save"></button>
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    ctx = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      getImageData: jest.fn(),
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

  it("activates bucket tool from toolbar", () => {
    const spy = jest.spyOn(handle.editor, "setTool");
    (document.getElementById("bucket") as HTMLButtonElement).click();
    expect(spy.mock.calls[0][0]).toBeInstanceOf(BucketFillTool);
  });

  it("activates bucket tool via shortcut", () => {
    const spy = jest.spyOn(handle.editor, "setTool");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
    expect(spy.mock.calls[0][0]).toBeInstanceOf(BucketFillTool);
  });
});
