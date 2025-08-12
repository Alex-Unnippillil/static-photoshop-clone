import { initEditor } from "../src/editor";
import { Editor } from "../src/core/Editor";

describe("editor", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor | undefined;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="imageLoader" />
      <button id="save"></button>
      <button id="undo"></button>
      <button id="redo"></button>
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;


    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.toDataURL = jest.fn();


  });

  function dispatch(type: string, x: number, y: number, buttons = 0) {
    const event = new MouseEvent(type, { bubbles: true } as MouseEventInit);
    Object.defineProperty(event, "offsetX", { value: x });
    Object.defineProperty(event, "offsetY", { value: y });
    Object.defineProperty(event, "buttons", { value: buttons });
    canvas.dispatchEvent(event);
  }

  it("draws and supports undo/redo", async () => {
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointermove", 10, 10, 1);
    dispatch("pointerup", 10, 10, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.stroke).toHaveBeenCalled();

    (document.getElementById("undo") as HTMLButtonElement).click();
    expect(ctx.putImageData).toHaveBeenCalledTimes(1);

    (document.getElementById("redo") as HTMLButtonElement).click();
    expect(ctx.putImageData).toHaveBeenCalledTimes(2);
  });

  it("calls toDataURL when Save is clicked", () => {
    (document.getElementById("save") as HTMLButtonElement).click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
  });

  it("loads an image file and draws it", async () => {
    const loader = document.getElementById("imageLoader") as HTMLInputElement;
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    Object.defineProperty(loader, "files", {
      value: [file],
      writable: false,
    });

    loader.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 0));

    expect(canvas.toDataURL).toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalled();
    const instances = (globalThis.FileReader as unknown as jest.Mock).mock
      .instances;
    expect(instances[0].readAsDataURL).toHaveBeenCalledWith(file);
  });

  it("draws a line", () => {
    (document.getElementById("line") as HTMLButtonElement).click();
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointerup", 5, 5, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(5, 5);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws a circle", () => {
    (document.getElementById("circle") as HTMLButtonElement).click();
    dispatch("pointerdown", 0, 0, 1);
    dispatch("pointerup", 3, 4, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalledWith(0, 0, 5, 0, Math.PI * 2);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it("draws text", () => {
    (document.getElementById("text") as HTMLButtonElement).click();
    const promptSpy = jest
      .spyOn(window, "prompt")
      .mockReturnValue("Hello");
    dispatch("pointerdown", 10, 20, 1);

    expect(promptSpy).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith("Hello", 10, 20);
    promptSpy.mockRestore();
  });

  it("erases using destination-out compositing", () => {
    // Switch to eraser tool
    (document.getElementById("eraser") as HTMLButtonElement).click();

    dispatch("pointerdown", 5, 5, 1);
    dispatch("pointermove", 6, 6, 1);

    expect(ctx.globalCompositeOperation).toBe("destination-out");

    dispatch("pointerup", 6, 6, 0);

    expect(ctx.globalCompositeOperation).toBe("source-over");
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
