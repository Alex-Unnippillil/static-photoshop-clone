import type { EditorHandle } from "../src/editor.js";
import { initEditor } from "../src/editor.js";
import { PencilTool } from "../src/tools/PencilTool.js";
import { EraserTool } from "../src/tools/EraserTool.js";
import { RectangleTool } from "../src/tools/RectangleTool.js";
import { LineTool } from "../src/tools/LineTool.js";
import { CircleTool } from "../src/tools/CircleTool.js";
import { TextTool } from "../src/tools/TextTool.js";

describe("toolbar controls", () => {
  let handle: EditorHandle;
  let canvas: HTMLCanvasElement;
  let ctx: Partial<CanvasRenderingContext2D>;
  beforeEach(() => {
    document.body.innerHTML = `
      <canvas id="canvas"></canvas>
      <canvas id="canvas2"></canvas>
      <input id="colorPicker" value="#000000" />
      <input id="lineWidth" value="2" />
      <input id="fillMode" type="checkbox" />

      <button id="pencil"></button>
      <button id="eraser"></button>
      <button id="rectangle"></button>
      <button id="line"></button>
      <button id="circle"></button>
      <button id="text"></button>

      <button id="undo"></button>
      <button id="redo"></button>
      <select id="layerSelect"><option value="0">Layer1</option><option value="1">Layer2</option></select>
    `;

    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const canvas2 = document.getElementById("canvas2") as HTMLCanvasElement;
    ctx = {
      setTransform: jest.fn(),
      scale: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
    };
    const ctx2 = { ...ctx } as Partial<CanvasRenderingContext2D>;
    canvas.getContext = jest.fn().mockReturnValue(ctx as CanvasRenderingContext2D);
    canvas2.getContext = jest.fn().mockReturnValue(ctx2 as CanvasRenderingContext2D);

    [canvas, canvas2].forEach((c) => {
      c.getBoundingClientRect = () => ({
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
    });


    handle = initEditor();
  });

  afterEach(() => {
    handle.destroy();
  });

    it("switches tools when buttons are clicked", () => {
      const spy = jest.spyOn(handle.editor, "setTool");
      (document.getElementById("pencil") as HTMLButtonElement).click();
      expect(spy.mock.calls[0][0]).toBeInstanceOf(PencilTool);

      (document.getElementById("eraser") as HTMLButtonElement).click();
      expect(spy.mock.calls[1][0]).toBeInstanceOf(EraserTool);

      (document.getElementById("rectangle") as HTMLButtonElement).click();
      expect(spy.mock.calls[2][0]).toBeInstanceOf(RectangleTool);

      (document.getElementById("line") as HTMLButtonElement).click();
      expect(spy.mock.calls[3][0]).toBeInstanceOf(LineTool);

      (document.getElementById("circle") as HTMLButtonElement).click();
      expect(spy.mock.calls[4][0]).toBeInstanceOf(CircleTool);

      (document.getElementById("text") as HTMLButtonElement).click();
      expect(spy.mock.calls[5][0]).toBeInstanceOf(TextTool);
    });

    it("routes tool changes to the selected layer", () => {
      const firstSpy = jest.spyOn(handle.editors[0], "setTool");
      const secondSpy = jest.spyOn(handle.editors[1], "setTool");

      (document.getElementById("pencil") as HTMLButtonElement).click();
      expect(firstSpy).toHaveBeenCalled();
      expect(secondSpy).not.toHaveBeenCalled();

      const select = document.getElementById("layerSelect") as HTMLSelectElement;
      select.value = "1";
      select.dispatchEvent(new Event("change"));

      (document.getElementById("eraser") as HTMLButtonElement).click();
      expect(secondSpy).toHaveBeenCalled();
    });

  it("triggers undo and redo when buttons are clicked", () => {
    const undo = jest.spyOn(handle.editor, "undo").mockImplementation(() => {});
    const redo = jest.spyOn(handle.editor, "redo").mockImplementation(() => {});
    const undoBtn = document.getElementById("undo") as HTMLButtonElement;
    const redoBtn = document.getElementById("redo") as HTMLButtonElement;
    // ensure buttons are enabled for the test
    undoBtn.disabled = false;
    redoBtn.disabled = false;
    undoBtn.click();
    expect(undo).toHaveBeenCalled();
    // undo click will toggle button states; re-enable redo for this test
    redoBtn.disabled = false;
    redoBtn.click();
    expect(redo).toHaveBeenCalled();
  });
});

