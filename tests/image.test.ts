import { initEditor, EditorHandle } from "../src/editor.js";

describe("image load and save", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let handle: EditorHandle;
  let anchor: { href: string; download: string; click: jest.Mock };
  let createElementSpy: jest.SpyInstance;
  let fileReaderSpy: jest.SpyInstance;
  let imageSpy: jest.SpyInstance;

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
      <button id="bucket"></button>
      <button id="eyedropper"></button>
      <input id="imageLoader" type="file" />
      <select id="formatSelect"><option value="png">PNG</option></select>
      <button id="save"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const imageData = {
      data: new Uint8ClampedArray(),
      width: 100,
      height: 100,
    } as ImageData;
    ctx = {
      drawImage: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      getImageData: jest.fn().mockReturnValue(imageData),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.toDataURL = jest
      .fn()
      .mockReturnValue("data:image/png;base64,SAVE");
    canvas.getBoundingClientRect = () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    anchor = { href: "", download: "", click: jest.fn() };
    createElementSpy = jest
      .spyOn(document, "createElement")
      .mockReturnValue(anchor as any);

    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: () => void = () => {};
      readAsDataURL(_file: Blob) {
        this.result = "data:image/png;base64,LOAD";
        this.onload();
      }
    }
    fileReaderSpy = jest
      .spyOn(window as any, "FileReader")
      .mockImplementation(() => new MockFileReader() as any);

    class MockImage {
      onload: () => void = () => {};
      set src(_src: string) {
        setTimeout(() => this.onload(), 0);
      }
    }
    imageSpy = jest
      .spyOn(window as any, "Image")
      .mockImplementation(() => new MockImage() as any);

    handle = initEditor();
  });

  afterEach(() => {
    handle.destroy();
    createElementSpy.mockRestore();
    fileReaderSpy.mockRestore();
    imageSpy.mockRestore();
  });

  it("loads an image from input", async () => {
    const file = new File([""], "test.png", { type: "image/png" });
    const loader = document.getElementById("imageLoader") as HTMLInputElement;
    Object.defineProperty(loader, "files", {
      value: [file],
      configurable: true,
    });
    loader.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it("adds state to undo stack when loading image", async () => {
    const file = new File([""], "test.png", { type: "image/png" });
    const loader = document.getElementById("imageLoader") as HTMLInputElement;
    Object.defineProperty(loader, "files", {
      value: [file],
      configurable: true,
    });
    loader.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 0));
    expect(handle.editor.canUndo).toBe(true);
    handle.editor.undo();
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(handle.editor.canRedo).toBe(true);
    handle.editor.redo();
    expect(ctx.putImageData).toHaveBeenCalledTimes(2);
  });

  it("reloads the same image after undo", async () => {
    const file = new File([""], "test.png", { type: "image/png" });
    const loader = document.getElementById("imageLoader") as HTMLInputElement;
    const selectFile = async () => {
      const prev = loader.value;
      Object.defineProperty(loader, "files", {
        value: [file],
        configurable: true,
      });
      Object.defineProperty(loader, "value", {
        value: `C:/fakepath/${file.name}`,
        configurable: true,
        writable: true,
      });
      if (loader.value !== prev) {
        loader.dispatchEvent(new Event("change"));
        await new Promise((r) => setTimeout(r, 0));
      }
    };

    await selectFile();
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);

    handle.editor.undo();
    expect(handle.editor.canRedo).toBe(true);

    await selectFile();
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
  });

  it("saves the canvas as an image", () => {

    const save = document.getElementById("save") as HTMLButtonElement;
    save.click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(anchor.href).toBe("data:image/png;base64,SAVE");
    expect(anchor.download).toBe("canvas.png");
    expect(anchor.click).toHaveBeenCalled();
  });
});
