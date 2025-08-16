import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import { Tool } from "./tools/Tool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
}


  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  // --- Tool Buttons --------------------------------------------------------
  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement | null;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement | null;
  const rectangleBtn = document.getElementById("rectangle") as HTMLButtonElement | null;
  const lineBtn = document.getElementById("line") as HTMLButtonElement | null;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement | null;
  const textBtn = document.getElementById("text") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;


  };

  return { editor, destroy };
}

