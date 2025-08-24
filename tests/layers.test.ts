import { initEditor, EditorHandle } from "../src/editor.js";

describe("layer management", () => {
  let handle: EditorHandle;
  let addBtn: HTMLButtonElement;
  let deleteBtn: HTMLButtonElement;
  let layerSelect: HTMLSelectElement;
  let undoBtn: HTMLButtonElement;
  let redoBtn: HTMLButtonElement;
  let ctx1: Partial<CanvasRenderingContext2D>;
  let ctx2: Partial<CanvasRenderingContext2D>;
  let ctx3: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toolbar"></div>
      <div id="canvasContainer"><canvas id="c1"></canvas></div>
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
      <select id="formatSelect"><option value="png">PNG</option></select>
      <button id="save"></button>
      <button id="undo"></button>
      <button id="redo"></button>
      <button id="addLayer"></button>
      <button id="deleteLayer"></button>
      <select id="layerSelect"></select>
    `;

    addBtn = document.getElementById("addLayer") as HTMLButtonElement;
    deleteBtn = document.getElementById("deleteLayer") as HTMLButtonElement;
    layerSelect = document.getElementById("layerSelect") as HTMLSelectElement;
    undoBtn = document.getElementById("undo") as HTMLButtonElement;
    redoBtn = document.getElementById("redo") as HTMLButtonElement;

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
    ctx3 = {
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

    const contexts = [ctx1, ctx2, ctx3];
    let ctxIndex = 0;
    HTMLCanvasElement.prototype.getContext = jest
      .fn()
      .mockImplementation(() => contexts[ctxIndex++] as any);
    HTMLCanvasElement.prototype.getBoundingClientRect = () => rect;

    handle = initEditor();
  });

  afterEach(() => handle.destroy());

  it("creates a new layer when Add Layer is clicked", () => {
    expect(layerSelect.options.length).toBe(1);
    addBtn.click();
    expect(layerSelect.options.length).toBe(2);
    expect(document.querySelectorAll("canvas").length).toBe(2);
  });

  it("deletes the selected layer", () => {
    addBtn.click();
    layerSelect.value = "1";
    layerSelect.dispatchEvent(new Event("change"));
    deleteBtn.click();
    expect(layerSelect.options.length).toBe(1);
    expect(document.querySelectorAll("canvas").length).toBe(1);
  });

  it("reorders layers via drag and drop", () => {
    addBtn.click();
    addBtn.click();
    const canvases = Array.from(document.querySelectorAll("canvas"));
    const option = layerSelect.options[2];
    option.dispatchEvent(new Event("dragstart", { bubbles: true }));
    layerSelect.options[0].dispatchEvent(new Event("drop", { bubbles: true }));
    const reordered = Array.from(document.querySelectorAll("canvas"));
    expect(reordered[0]).toBe(canvases[2]);
  });

  it("targets the active layer and toggles button states", () => {
    addBtn.click();
    handle.activateLayer(0);

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

