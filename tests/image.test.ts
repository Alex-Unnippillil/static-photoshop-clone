import { initEditor, EditorHandle } from "../src/editor.js";

describe("image operations", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let handle: EditorHandle;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <select id="fontFamily"><option value="sans-serif"></option></select>
      <input id="fontSize" value="16" />
      <input id="imageLoader" type="file" />
      <button id="save"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    ctx = {
      drawImage: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.toDataURL = jest.fn().mockReturnValue("data:img/png;base64,SAVE");
    canvas.getBoundingClientRect = () => ({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    class MockFileReader {
      result: string | null = null;
      onload: () => void = () => {};
      readAsDataURL(_file: File) {
        this.result = "data:image/png;base64,LOAD";
        this.onload();
      }
    }
    (global as any).FileReader = MockFileReader;

    class MockImage {
      onload: () => void = () => {};
      set src(_src: string) {
        setTimeout(() => this.onload(), 0);
      }
    }
    (global as any).Image = MockImage;

    handle = initEditor();
  });

  afterEach(() => {
    handle.destroy();
    jest.restoreAllMocks();
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
    const click = jest.fn();
    const anchor = { href: "", download: "", click } as any;
    jest.spyOn(document, "createElement").mockReturnValue(anchor);
    const save = document.getElementById("save") as HTMLButtonElement;
    save.click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png", undefined);
    expect(anchor.href).toBe("data:img/png;base64,SAVE");
    expect(anchor.download).toBe("canvas.png");
    expect(click).toHaveBeenCalled();
  });
});

