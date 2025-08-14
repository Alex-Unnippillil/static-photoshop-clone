import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
}

export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const pencilBtn = document.getElementById("pencil") as HTMLButtonElement;
  const eraserBtn = document.getElementById("eraser") as HTMLButtonElement;
  const rectBtn = document.getElementById("rectangle") as HTMLButtonElement;
  const lineBtn = document.getElementById("line") as HTMLButtonElement;
  const circleBtn = document.getElementById("circle") as HTMLButtonElement;
  const textBtn = document.getElementById("text") as HTMLButtonElement;
  const undoBtn = document.getElementById("undo") as HTMLButtonElement;
  const redoBtn = document.getElementById("redo") as HTMLButtonElement;
  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement;
  const saveBtn = document.getElementById("save") as HTMLButtonElement;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  editor.setTool(new PencilTool());
  const shortcuts = new Shortcuts(editor);


    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();

    };
    reader.readAsDataURL(file);
  });


  });

  return {
    editor,
    destroy() {

      shortcuts.destroy();
      editor.destroy();
    },
  };
}

