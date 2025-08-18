import { initEditor, EditorHandle } from "../src/editor.js";

describe("image operations", () => {
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D> = {
    drawImage: jest.fn(),
    setTransform: jest.fn(),
    scale: jest.fn(),
  };
  let handle: EditorHandle;

    beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <input id="imageLoader" type="file" />
      <button id="save"></button>
    `;


    const readSpy = jest.fn().mockImplementation(function (this: MockFileReader) {
      this.result = "data:image/png;base64,LOAD";
      this.onload();
    });

      class MockImage {
        onload: () => void = () => {};
        set src(_src: string) {
          setTimeout(() => this.onload(), 0);
        }
      }


  });

  afterEach(() => {
    handle.destroy();
  });

  it("loads an image from input", async () => {
    const file = new File([""], "test.png", { type: "image/png" });
    const loader = document.getElementById("imageLoader") as HTMLInputElement;
    Object.defineProperty(loader, "files", { value: [file], configurable: true });
    loader.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 0));

    expect(ctx.drawImage).toHaveBeenCalled();
  });

  it("saves the canvas as an image", () => {
    const click = jest.fn();

    jest.spyOn(document, "createElement").mockReturnValue(anchor);
    const save = document.getElementById("save") as HTMLButtonElement;
    save.click();
    expect(canvas.toDataURL).toHaveBeenCalledWith("image/png");
    expect(anchor.href).toBe("data:img/png;base64,SAVE");
    expect(anchor.download).toBe("canvas.png");
    expect(click).toHaveBeenCalled();
  });
});
