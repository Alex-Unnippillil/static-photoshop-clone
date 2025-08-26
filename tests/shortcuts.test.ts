import { initEditor, EditorHandle } from "../src/editor.js";
import { RectangleTool } from "../src/tools/RectangleTool.js";
import { PencilTool } from "../src/tools/PencilTool.js";
import { EraserTool } from "../src/tools/EraserTool.js";
import { EyedropperTool } from "../src/tools/EyedropperTool.js";
import { LineTool } from "../src/tools/LineTool.js";
import { CircleTool } from "../src/tools/CircleTool.js";
import { TextTool } from "../src/tools/TextTool.js";
import { BucketFillTool } from "../src/tools/BucketFillTool.js";
import { Shortcuts } from "../src/core/Shortcuts.js";
import { Editor } from "../src/core/Editor.js";

describe("keyboard shortcuts", () => {
  let handle: EditorHandle;
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;

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
    ctx = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    };
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
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
    handle = initEditor();
  });

  afterEach(() => {
    handle.destroy();
  });

  it("switches tools with letter keys", () => {
    const spy = jest.spyOn(handle.editor, "setTool");
    const cases: [string, any][] = [
      ["r", RectangleTool],
      ["p", PencilTool],
      ["e", EraserTool],
      ["i", EyedropperTool],
      ["l", LineTool],
      ["c", CircleTool],
      ["t", TextTool],
      ["b", BucketFillTool],
    ];

    cases.forEach(([key, ToolClass], index) => {
      const event = new KeyboardEvent("keydown", { key, cancelable: true });
      const prevent = jest.spyOn(event, "preventDefault");
      document.dispatchEvent(event);
      expect(spy.mock.calls[index][0]).toBeInstanceOf(ToolClass);
      expect(prevent).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    });
  });

  it("performs undo and redo with shortcuts", () => {
    const undo = jest.spyOn(handle.editor, "undo").mockImplementation(() => {});
    const redo = jest.spyOn(handle.editor, "redo").mockImplementation(() => {});
    const undoEvent = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, cancelable: true });
    document.dispatchEvent(undoEvent);
    expect(undo).toHaveBeenCalled();
    expect(undoEvent.defaultPrevented).toBe(true);

    const redoEvent = new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true, cancelable: true });
    document.dispatchEvent(redoEvent);
    expect(redo).toHaveBeenCalled();
    expect(redoEvent.defaultPrevented).toBe(true);
  });

  it("switches active editor when requested", () => {
    const e1 = {
      setTool: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
    } as unknown as Editor;
    const e2 = {
      setTool: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
    } as unknown as Editor;

    const shortcuts = new Shortcuts(e1);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    expect(e1.setTool).toHaveBeenCalled();

    shortcuts.switchEditor(e2);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    expect(e2.setTool).toHaveBeenCalled();
    shortcuts.destroy();
  });
});
