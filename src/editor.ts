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
  /** Array of editors, one for each canvas layer. */
  editors: Editor[];
  /** Returns the editor for the currently active layer. */
  readonly editor: Editor;
  /** Clean up all listeners and editors. */
  destroy: () => void;
}


  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;
  const layerSelect = document.getElementById("layerSelect") as HTMLSelectElement | null;
  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;


  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);


  };
  imageLoader?.addEventListener("change", imageHandler);


    },
  };
}

