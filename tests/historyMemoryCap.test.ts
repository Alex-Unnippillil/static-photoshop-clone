import { Editor } from "../src/core/Editor.js";
import { initEditor, type EditorHandle } from "../src/editor.js";

describe("history memory cap", () => {
  let canvas: HTMLCanvasElement;
  let colorPicker: HTMLInputElement;
  let lineWidth: HTMLInputElement;
  let fillMode: HTMLInputElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  let editor: Editor;

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="1" />
      <input id="fillMode" type="checkbox" />
    `;
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
    lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
    fillMode = document.getElementById("fillMode") as HTMLInputElement;

    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    canvas.getBoundingClientRect = () => ({
      width: 1,
      height: 1,
      top: 0,
      left: 0,
      right: 1,
      bottom: 1,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    ctx = {
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };
    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
  });

  afterEach(() => {
    editor?.destroy();
  });

  it("drops oldest undo snapshots when exceeding cap", () => {
    const snapshots: ImageData[] = [];
    (ctx.getImageData as jest.Mock).mockImplementation(() => {
      const image = {
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      } as ImageData;
      snapshots.push(image);
      return image;
    });

    editor = new Editor(
      canvas,
      colorPicker,
      lineWidth,
      fillMode,
      undefined,
      undefined,
      undefined,
      { historyMemoryCapBytes: 8 },
    );

    editor.saveState();
    editor.saveState();
    editor.saveState();

    const undoStack = (editor as any).undoStack as Array<{ image: ImageData }>;
    expect(undoStack).toHaveLength(2);
    expect(undoStack[0].image).toBe(snapshots[1]);
    expect(undoStack[1].image).toBe(snapshots[2]);
  });

  it("clears history when cap is zero", () => {
    (ctx.getImageData as jest.Mock).mockImplementation(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    }) as ImageData);

    editor = new Editor(
      canvas,
      colorPicker,
      lineWidth,
      fillMode,
      undefined,
      undefined,
      undefined,
      { historyMemoryCapBytes: 0 },
    );

    editor.saveState();
    expect(editor.canUndo).toBe(false);
    expect((editor as any).undoStack).toHaveLength(0);
  });
});

describe("initEditor history settings", () => {
  let handle: EditorHandle | null = null;
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toolbar">
        <button id="pencil"></button>
        <button id="eraser"></button>
        <button id="rectangle"></button>
        <button id="line"></button>
        <button id="circle"></button>
        <button id="text"></button>
        <button id="bucket"></button>
        <button id="eyedropper"></button>
      </div>
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="1" />
      <input id="fillMode" type="checkbox" />
      <select id="formatSelect"><option value="png">PNG</option></select>
      <button id="save"></button>
      <button id="undo"></button>
      <button id="redo"></button>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    (canvas as any).setPointerCapture = jest.fn();
    (canvas as any).releasePointerCapture = jest.fn();
    canvas.getBoundingClientRect = () => ({
      width: 1,
      height: 1,
      top: 0,
      left: 0,
      right: 1,
      bottom: 1,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    ctx = {
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };

    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.toDataURL = jest.fn().mockReturnValue("data:image/png;base64,TEST");
  });

  afterEach(() => {
    handle?.destroy();
    handle = null;
  });

  it("forwards history cap settings to editors", () => {
    const snapshots: ImageData[] = [];
    (ctx.getImageData as jest.Mock).mockImplementation(() => {
      const image = {
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      } as ImageData;
      snapshots.push(image);
      return image;
    });

    handle = initEditor({ historyMemoryCapBytes: 4 });
    handle.editor.saveState();
    handle.editor.saveState();

    const undoStack = (handle.editor as any).undoStack as Array<{ image: ImageData }>;
    expect(undoStack).toHaveLength(1);
    expect(undoStack[0].image).toBe(snapshots[1]);
  });
});
