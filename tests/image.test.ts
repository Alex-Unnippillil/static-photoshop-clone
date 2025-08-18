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
      <input id="imageLoader" type="file" />
      <button id="save"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      drawImage: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx);
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

  it("saves the canvas as an image", () => {
    const save = document.getElementById("save") as HTMLButtonElement;
    save.click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(anchor.href).toBe("data:image/png;base64,SAVE");
    expect(anchor.download).toBe("canvas.png");
    expect(anchor.click).toHaveBeenCalled();
  });
});
