import { Editor } from "../src/core/Editor";
import { RectangleTool } from "../src/tools/RectangleTool";
import { DrawingTool } from "../src/tools/DrawingTool";

describe("RectangleTool", () => {
  let editor: Editor;
  let ctx: Partial<CanvasRenderingContext2D>;



  it("draws a rectangle on pointer up", () => {
    const tool = new RectangleTool();
    expect(tool).toBeInstanceOf(DrawingTool);
    tool.onPointerDown({ offsetX: 10, offsetY: 15 } as PointerEvent, editor);
    tool.onPointerUp({ offsetX: 20, offsetY: 25 } as PointerEvent, editor);
    expect(ctx.strokeRect).toHaveBeenCalledWith(10, 15, 10, 10);

});
