import { initEditor, EditorHandle } from "../src/editor.js";
import { Shortcuts } from "../src/core/Shortcuts.js";

describe("editor destroy cleanup", () => {
  let handle: EditorHandle;
  let canvas: HTMLCanvasElement;
  let canvasListeners: Record<string, EventListener[]>;
  let windowListeners: Record<string, EventListener[]>;
  let documentListeners: Record<string, EventListener[]>;

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
      <select id="formatSelect"><option value="png">PNG</option></select>
      <button id="save"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();

    const ctx: Partial<CanvasRenderingContext2D> = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
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

    canvasListeners = {};
    windowListeners = {};
    documentListeners = {};

    jest.spyOn(canvas, "addEventListener").mockImplementation(
      (type: any, listener: any) => {
        (canvasListeners[type] ||= []).push(listener);
      },
    );
    jest.spyOn(window, "addEventListener").mockImplementation(
      (type: any, listener: any) => {
        (windowListeners[type] ||= []).push(listener);
      },
    );
    jest.spyOn(document, "addEventListener").mockImplementation(
      (type: any, listener: any) => {
        (documentListeners[type] ||= []).push(listener);
      },
    );

    jest.spyOn(canvas, "removeEventListener");
    jest.spyOn(window, "removeEventListener");
    jest.spyOn(document, "removeEventListener");

    jest.spyOn(Shortcuts.prototype, "destroy");

    handle = initEditor();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("removes all event listeners and shortcuts", () => {
    handle.destroy();

    const canvasRemove = canvas.removeEventListener as jest.Mock;
    const windowRemove = window.removeEventListener as jest.Mock;
    const documentRemove = document.removeEventListener as jest.Mock;
    const shortcutsDestroy = Shortcuts.prototype.destroy as jest.Mock;

    expect(canvasRemove).toHaveBeenCalledWith(
      "pointerdown",
      canvasListeners["pointerdown"][0],
    );
    expect(canvasRemove).toHaveBeenCalledWith(
      "pointermove",
      canvasListeners["pointermove"][0],
    );
    expect(canvasRemove).toHaveBeenCalledWith(
      "pointerup",
      canvasListeners["pointerup"][0],
    );

    expect(windowRemove).toHaveBeenCalledWith(
      "resize",
      windowListeners["resize"][0],
    );

    expect(documentRemove).toHaveBeenCalledWith(
      "keydown",
      documentListeners["keydown"][0],
    );

    expect(shortcutsDestroy).toHaveBeenCalled();
  });
});

