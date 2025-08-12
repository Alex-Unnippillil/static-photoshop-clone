import { Editor } from "../src/core/Editor";
import { RectangleTool } from "../src/tools/RectangleTool";

describe("RectangleTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;



  it("draws a rectangle on pointer up", () => {
    const tool = new RectangleTool();
    tool.onPointerDown({ offsetX: 10, offsetY: 15 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 20, offsetY: 25 } as PointerEvent, editor);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 15, 10, 10);
    expect(ctx.lineWidth).toBe(2);
    expect(ctx.strokeStyle).toBe("#000000");
  });

  it("previews rectangle on pointer move", () => {
    const tool = new RectangleTool();
    tool.onPointerDown({ offsetX: 5, offsetY: 5 } as PointerEvent, editor);
    tool.onPointerMove(
      { offsetX: 15, offsetY: 15, buttons: 1 } as unknown as PointerEvent,
      editor,
    );
    expect(ctx.putImageData).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalledWith(5, 5, 10, 10);
  });
});
