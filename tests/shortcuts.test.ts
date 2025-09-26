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

  const flushPromises = async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  it("switches tools with letter keys", async () => {
    const spy = jest.spyOn(handle.editor, "setTool");
    const cases: Array<[string, any, string]> = [
      ["r", RectangleTool, "rectangle"],
      ["p", PencilTool, "pencil"],
      ["e", EraserTool, "eraser"],
      ["i", EyedropperTool, "eyedropper"],
      ["l", LineTool, "line"],
      ["c", CircleTool, "circle"],
      ["t", TextTool, "text"],
      ["b", BucketFillTool, "bucket"],
    ];

    const lazyToolIds = new Set(["text", "bucket", "eyedropper"]);

    for (const [key, ToolClass, toolId] of cases) {
      if (lazyToolIds.has(toolId)) {
        await handle.loadTool(toolId);
      }
      const event = new KeyboardEvent("keydown", { key, cancelable: true });
      const prevent = jest.spyOn(event, "preventDefault");
      document.dispatchEvent(event);
      await flushPromises();
      const lastCall = spy.mock.calls[spy.mock.calls.length - 1];
      expect(lastCall?.[0]).toBeInstanceOf(ToolClass);
      expect(prevent).toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(true);
    }
  });

  it("performs undo and redo with shortcuts", () => {
    const undo = jest.spyOn(handle.editor, "undo").mockImplementation(() => {});
    const redo = jest.spyOn(handle.editor, "redo").mockImplementation(() => {});

    const undoEvent = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      cancelable: true,
    });
    document.dispatchEvent(undoEvent);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(undoEvent.defaultPrevented).toBe(true);

    const redoEventCtrlShiftZ = new KeyboardEvent("keydown", {
      key: "z",
      ctrlKey: true,
      shiftKey: true,
      cancelable: true,
    });
    document.dispatchEvent(redoEventCtrlShiftZ);
    expect(redo).toHaveBeenCalledTimes(1);
    expect(redoEventCtrlShiftZ.defaultPrevented).toBe(true);

    const redoEventCtrlY = new KeyboardEvent("keydown", {
      key: "y",
      ctrlKey: true,
      cancelable: true,
    });
    document.dispatchEvent(redoEventCtrlY);
    expect(redo).toHaveBeenCalledTimes(2);
    expect(redoEventCtrlY.defaultPrevented).toBe(true);

    const redoEventCmdShiftZ = new KeyboardEvent("keydown", {
      key: "z",
      metaKey: true,
      shiftKey: true,
      cancelable: true,
    });
    document.dispatchEvent(redoEventCmdShiftZ);
    expect(redo).toHaveBeenCalledTimes(3);
    expect(redoEventCmdShiftZ.defaultPrevented).toBe(true);
  });

  it("switches active editor when requested", async () => {
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

    const shortcuts = new Shortcuts(e1, async () => PencilTool);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    await flushPromises();
    expect(e1.setTool).toHaveBeenCalled();

    shortcuts.switchEditor(e2);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "p" }));
    await flushPromises();
    expect(e2.setTool).toHaveBeenCalled();
    shortcuts.destroy();
  });
});
