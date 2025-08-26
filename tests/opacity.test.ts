import { initEditor, EditorHandle } from "../src/editor.js";

describe("layer opacity", () => {
  let handle: EditorHandle;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="canvasContainer">
        <canvas id="canvas"></canvas>
        <canvas id="layer2"></canvas>
      </div>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <input id="layer2Opacity" value="100" />
      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>
      <button id="bucket"></button>
      <button id="eyedropper"></button>
      <select id="formatSelect"><option value="png">PNG</option></select>
      <button id="save"></button>
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = {
      drawImage: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    } as any;
    canvas.getContext = jest.fn().mockReturnValue(ctx);
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

    const layer2 = document.getElementById("layer2") as HTMLCanvasElement;
    layer2.getContext = jest.fn().mockReturnValue(ctx);
    layer2.getBoundingClientRect = canvas.getBoundingClientRect;

    handle = initEditor();
  });

  afterEach(() => {
    handle.destroy();
    jest.restoreAllMocks();
  });

  it("updates layer opacity style", () => {
    const slider = document.getElementById("layer2Opacity") as HTMLInputElement;
    const layer = document.getElementById("layer2") as HTMLCanvasElement;
    slider.value = "30";
    slider.dispatchEvent(new Event("input"));
    expect(layer.style.opacity).toBe("0.3");
  });

  it("uses layer opacity when saving", () => {
    const slider = document.getElementById("layer2Opacity") as HTMLInputElement;
    slider.value = "50";
    slider.dispatchEvent(new Event("input"));

    const tempCtxAlpha: number[] = [];
    const tempCtx = {
      drawImage: jest.fn().mockImplementation(() => {
        tempCtxAlpha.push(tempCtx.globalAlpha);
      }),
      globalAlpha: 1,
    } as any;
    const tempCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(tempCtx),
      toDataURL: jest.fn().mockReturnValue("data"),
    } as any;
    const origCreate = document.createElement.bind(document);
    const createSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "canvas") return tempCanvas;
        return origCreate(tag);
      });

    const save = document.getElementById("save") as HTMLButtonElement;
    save.click();

    expect(tempCtx.drawImage).toHaveBeenCalledTimes(2);
    expect(tempCtxAlpha).toEqual([1, 0.5]);
    expect(tempCanvas.toDataURL).toHaveBeenCalledWith("image/png");

    createSpy.mockRestore();
  });
});

