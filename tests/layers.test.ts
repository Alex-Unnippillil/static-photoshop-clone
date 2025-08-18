import { initEditor, EditorHandle } from "../src/editor.js";

describe("layer-specific undo/redo", () => {
  let handle: EditorHandle;
  let canvas1: HTMLCanvasElement;
  let canvas2: HTMLCanvasElement;
  let ctx1: Partial<CanvasRenderingContext2D>;
  let ctx2: Partial<CanvasRenderingContext2D>;
  let undoBtn: HTMLButtonElement;
  let redoBtn: HTMLButtonElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="c1"></canvas>
      <canvas id="c2"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
      <button id="pencil"></button>
      <button id="undo"></button>
      <button id="redo"></button>
    `;

    canvas1 = document.getElementById("c1") as HTMLCanvasElement;
    canvas2 = document.getElementById("c2") as HTMLCanvasElement;

    const rect = {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    };

    ctx1 = {
      clearRect: jest.fn(),
      putImageData: jest.fn(),
      getImageData: jest
        .fn()
        .mockReturnValue({
          data: new Uint8ClampedArray(),
          width: 1,
          height: 1,
        } as ImageData),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    ctx2 = {
      clearRect: jest.fn(),
      putImageData: jest.fn(),
      getImageData: jest
        .fn()
        .mockReturnValue({
          data: new Uint8ClampedArray(),
          width: 1,
          height: 1,
        } as ImageData),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };

    canvas1.getContext = jest.fn().mockReturnValue(ctx1 as any);
    canvas2.getContext = jest.fn().mockReturnValue(ctx2 as any);
    canvas1.getBoundingClientRect = canvas2.getBoundingClientRect = () => rect;

    handle = initEditor();
    undoBtn = document.getElementById("undo") as HTMLButtonElement;
    redoBtn = document.getElementById("redo") as HTMLButtonElement;
  });

  afterEach(() => handle.destroy());

  it("targets the active layer and toggles button states", () => {
    // initially disabled
    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(true);

    // add state to first layer
    handle.editor.saveState();
    expect(undoBtn.disabled).toBe(false);

    // switch to second layer – no history yet
    handle.activateLayer(1);
    expect(undoBtn.disabled).toBe(true);

    // add state to second layer and undo
    handle.editor.saveState();
    expect(undoBtn.disabled).toBe(false);
    undoBtn.click();
    expect(ctx2.putImageData).toHaveBeenCalled();
    expect(ctx1.putImageData).not.toHaveBeenCalled();
    expect(undoBtn.disabled).toBe(true);
    expect(redoBtn.disabled).toBe(false);

    // switch back to first layer – its undo stack still has entries
    handle.activateLayer(0);
    expect(undoBtn.disabled).toBe(false);
    expect(redoBtn.disabled).toBe(true);
  });
});

describe("layer control UI", () => {
  let handle: EditorHandle;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="c1"></canvas>
      <input id="c1Opacity" value="100" />
      <canvas id="c2"></canvas>
      <input id="c2Opacity" value="100" />
      <select id="layerSelect"></select>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />
    `;

    const rect = {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    };

    document
      .querySelectorAll("canvas")
      .forEach((canvas) => {
        const ctx = {
          clearRect: jest.fn(),
          putImageData: jest.fn(),
          getImageData: jest
            .fn()
            .mockReturnValue({
              data: new Uint8ClampedArray(),
              width: 1,
              height: 1,
            } as ImageData),
          setTransform: jest.fn(),
          scale: jest.fn(),
        } as any;
        (canvas as HTMLCanvasElement).getContext = jest.fn().mockReturnValue(ctx);
        (canvas as HTMLCanvasElement).getBoundingClientRect = () => rect;
      });

    handle = initEditor();
  });

  afterEach(() => handle.destroy());

  it("populates layerSelect and activates chosen layer", () => {
    const select = document.getElementById("layerSelect") as HTMLSelectElement;
    expect(select.options.length).toBe(2);
    select.value = "1";
    select.dispatchEvent(new Event("change"));
    expect(handle.editor).toBe(handle.editors[1]);
  });

  it("updates canvas opacity via slider", () => {
    const slider = document.getElementById("c2Opacity") as HTMLInputElement;
    const canvas = document.getElementById("c2") as HTMLCanvasElement;
    slider.value = "40";
    slider.dispatchEvent(new Event("input"));
    expect(canvas.style.opacity).toBe("0.4");
  });
});

