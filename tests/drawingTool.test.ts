import { DrawingTool } from "../src/tools/DrawingTool.js";
import { PencilTool } from "../src/tools/PencilTool.js";
import { RectangleTool } from "../src/tools/RectangleTool.js";
import { LineTool } from "../src/tools/LineTool.js";
import { CircleTool } from "../src/tools/CircleTool.js";
import { SprayTool } from "../src/tools/SprayTool.js";

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

  it("SprayTool extends DrawingTool", () => {
    expect(new SprayTool()).toBeInstanceOf(DrawingTool);
  });
});
