import { Editor } from "../src/core/Editor";

describe("layer drawing", () => {
  let editor: Editor;
  let layer1Ctx: any;
  let layer2Ctx: any;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
    const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

    const mainCtx = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({} as ImageData),
      putImageData: jest.fn(),
    } as any;
    canvas.getContext = jest.fn().mockReturnValue(mainCtx);
    canvas.getBoundingClientRect = () => ({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON() {},
    });

    layer1Ctx = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      fillRect: jest.fn(),
    };
    layer2Ctx = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      fillRect: jest.fn(),
    };

    const layerCanvases = [
      { width: 0, height: 0, getContext: jest.fn().mockReturnValue(layer1Ctx) },
      { width: 0, height: 0, getContext: jest.fn().mockReturnValue(layer2Ctx) },
    ];

    const originalCreate = document.createElement.bind(document);
    const createSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "canvas" && layerCanvases.length) {
          return layerCanvases.shift() as any;
        }
        return originalCreate(tag);
      });

    editor = new Editor(canvas, colorPicker, lineWidth);
    editor.addLayer();
    createSpy.mockRestore();
  });

  it("draws only on the active layer", () => {
    editor.setActiveLayer(1);
    editor.ctx.fillRect(0, 0, 10, 10);
    expect(layer1Ctx.fillRect).not.toHaveBeenCalled();
    expect(layer2Ctx.fillRect).toHaveBeenCalledTimes(1);

    editor.setActiveLayer(0);
    editor.ctx.fillRect(5, 5, 10, 10);
    expect(layer1Ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(layer2Ctx.fillRect).toHaveBeenCalledTimes(1);
  });
});

