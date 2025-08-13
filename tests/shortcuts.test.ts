import { initEditor } from "../src/editor";
import { PencilTool } from "../src/tools/PencilTool";
import { RectangleTool } from "../src/tools/RectangleTool";
import { LineTool } from "../src/tools/LineTool";
import { CircleTool } from "../src/tools/CircleTool";
import { TextTool } from "../src/tools/TextTool";
import { EraserTool } from "../src/tools/EraserTool";

function dispatchKey(key: string, ctrlKey = false, shiftKey = false) {
  const event = new KeyboardEvent("keydown", { key, ctrlKey, shiftKey });
  window.dispatchEvent(event);
}

describe("keyboard shortcuts", () => {
  let destroy: () => void;
  let editor: ReturnType<typeof initEditor>["editor"];

  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
    `;

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const mockImage = {
      data: new Uint8ClampedArray(),
      width: 100,
      height: 100,
    } as ImageData;

    const ctx: Partial<CanvasRenderingContext2D> = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      closePath: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => mockImage),
      putImageData: jest.fn(),
      strokeRect: jest.fn(),
      setTransform: jest.fn(),
      scale: jest.fn(),
    };

    canvas.getContext = jest
      .fn()
      .mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas.toDataURL = jest.fn();
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

    const handle = initEditor();
    editor = handle.editor;
    destroy = handle.destroy;
  });

  afterEach(() => {
    destroy();
  });

  it("switches tools using letter keys", () => {
    const setToolSpy = jest.spyOn(editor, "setTool");
    const cases: [string, any][] = [
      ["p", PencilTool],
      ["r", RectangleTool],
      ["l", LineTool],
      ["c", CircleTool],
      ["t", TextTool],
      ["e", EraserTool],
    ];

    for (const [key, ToolCtor] of cases) {
      setToolSpy.mockClear();
      dispatchKey(key);
      expect(setToolSpy).toHaveBeenCalledWith(expect.any(ToolCtor));
    }
  });

  it("triggers undo and redo", () => {
    const undoSpy = jest.spyOn(editor, "undo");
    const redoSpy = jest.spyOn(editor, "redo");

    dispatchKey("z", true);
    expect(undoSpy).toHaveBeenCalled();

    dispatchKey("z", true, true);
    expect(redoSpy).toHaveBeenCalled();
  });
});
