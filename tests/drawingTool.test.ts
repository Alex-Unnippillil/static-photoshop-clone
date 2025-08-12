import { DrawingTool } from "../src/tools/DrawingTool";
import { PencilTool } from "../src/tools/PencilTool";
import { RectangleTool } from "../src/tools/RectangleTool";
import { LineTool } from "../src/tools/LineTool";
import { CircleTool } from "../src/tools/CircleTool";

describe("DrawingTool subclasses", () => {
  it("PencilTool extends DrawingTool", () => {
    expect(new PencilTool()).toBeInstanceOf(DrawingTool);
  });

  it("RectangleTool extends DrawingTool", () => {
    expect(new RectangleTool()).toBeInstanceOf(DrawingTool);
  });

  it("LineTool extends DrawingTool", () => {
    expect(new LineTool()).toBeInstanceOf(DrawingTool);
  });

  it("CircleTool extends DrawingTool", () => {
    expect(new CircleTool()).toBeInstanceOf(DrawingTool);
  });
});
