import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import { EraserTool } from "./tools/EraserTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";


  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement;
  const rectangleBtn = document.getElementById("rectangle") as HTMLButtonElement;
  const lineBtn = document.getElementById("line") as HTMLButtonElement;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement;
  const textBtn = document.getElementById("text") as HTMLButtonElement;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const line = new LineTool();
  const circle = new CircleTool();
  const text = new TextTool();
  const eraser = new EraserTool();

}
