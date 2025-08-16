import { initEditor, EditorHandle } from "../src/editor";

// Integration tests ensuring toolbar controls are wired to the editor
// and trigger the expected behavior.
describe("editor toolbar controls", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let handle: EditorHandle;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>
      <input id="imageLoader" type="file" />
      <button id="undo"></button>
      <button id="redo"></button>
      <button id="save"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    const mockImage = {
      data: new Uint8ClampedArray(),
      width: 100,
      height: 100,
    } as ImageData;

    ctx = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => mockImage),
      putImageData: jest.fn(),
      strokeRect: jest.fn(),
      fillRect: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      drawImage: jest.fn(),
      fillText: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
      globalCompositeOperation: "source-over" as GlobalCompositeOperation,
    };

    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.toDataURL = jest.fn().mockReturnValue("data:image/png;base64,TEST");
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

  function dispatch(type: string, x: number, y: number, buttons = 0) {
    const event = new MouseEvent(type, { bubbles: true } as MouseEventInit);
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Object.defineProperty(event, "buttons", { value: buttons });
    Object.defineProperty(event, "pointerId", { value: 1 });
    canvas.dispatchEvent(event);
  }

  it("draws with pencil tool and supports undo/redo", () => {
    (document.getElementById("pencil") as HTMLButtonElement).click();
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointermove", 5, 5, 1);
    dispatch("pointerup", 5, 5, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(5, 5);
    expect(ctx.stroke).toHaveBeenCalled();

    (document.getElementById("undo") as HTMLButtonElement).click();
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    (document.getElementById("redo") as HTMLButtonElement).click();
    expect(ctx.clearRect).toHaveBeenCalledTimes(2);
    expect(ctx.putImageData).toHaveBeenCalledTimes(2);
  });

  it("uses eraser tool to clear", () => {
    (document.getElementById("eraser") as HTMLButtonElement).click();
    dispatch("pointerdown", 2, 2, 1);
    dispatch("pointermove", 4, 4, 1);
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it("resets compositing mode after erasing", () => {
    (document.getElementById("eraser") as HTMLButtonElement).click();
    dispatch("pointerdown", 0, 0, 1);
    expect((canvas.setPointerCapture as jest.Mock)).toHaveBeenCalledWith(1);
    expect(ctx.globalCompositeOperation).toBe("destination-out");
    dispatch("pointerup", 0, 0, 0);
    expect((canvas.releasePointerCapture as jest.Mock)).toHaveBeenCalledWith(1);
    expect(ctx.globalCompositeOperation).toBe("source-over");
  });

  it("previews rectangle during pointer move", () => {
    (document.getElementById("rectangle") as HTMLButtonElement).click();
    dispatch("pointerdown", 1, 1, 1);
    dispatch("pointermove", 3, 4, 1);
    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalledWith(1, 1, 2, 3);
  });

  it("draws line with line tool", () => {
    (document.getElementById("line") as HTMLButtonElement).click();
    dispatch("pointerdown", 1, 1, 1);
    dispatch("pointermove", 4, 5, 1);
    dispatch("pointerup", 4, 5, 0);
    expect(ctx.moveTo).toHaveBeenCalledWith(1, 1);
    expect(ctx.lineTo).toHaveBeenCalledWith(4, 5);
  });

  it("draws circle with circle tool", () => {
    (document.getElementById("circle") as HTMLButtonElement).click();
    dispatch("pointerdown", 2, 2, 1);
    dispatch("pointermove", 4, 2, 1);
    dispatch("pointerup", 4, 2, 0);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it("writes text with text tool", () => {
    (document.getElementById("text") as HTMLButtonElement).click();
    dispatch("pointerdown", 10, 10, 1);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    textarea.value = "hi";
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
    );
    expect(ctx.fillText).toHaveBeenCalledWith("hi", 10, 10);
    expect(document.querySelector("textarea")).toBeNull();
  });
});
