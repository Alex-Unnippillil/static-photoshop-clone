import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";
import { Tool } from "./tools/Tool";



  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth, fillMode);
  const shortcuts = new Shortcuts(editor);

  const listeners: Array<() => void> = [];
  const toolButtons: HTMLButtonElement[] = [];

  const addListener = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement | null,
    type: K,
    handler: (ev: HTMLElementEventMap[K]) => void,
  ) => {
    if (!el) return;
    el.addEventListener(type, handler as EventListener);
    listeners.push(() => el.removeEventListener(type, handler as EventListener));
  };

  const setActive = (btn: HTMLButtonElement) => {
    toolButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  };

  const registerTool = (id: string, ToolCtor: new () => Tool) => {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    if (!btn) return;
    toolButtons.push(btn);
    const handler = () => {
      editor.setTool(new ToolCtor());
      setActive(btn);
    };
    addListener(btn, "click", handler);
  };

  registerTool("pencil", PencilTool);
  registerTool("eraser", EraserTool);
  registerTool("rectangle", RectangleTool);
  registerTool("line", LineTool);
  registerTool("circle", CircleTool);
  registerTool("text", TextTool);

  const undoBtn = document.getElementById("undo") as HTMLButtonElement | null;
  const undoHandler = () => editor.undo();
  addListener(undoBtn, "click", undoHandler);

  const redoBtn = document.getElementById("redo") as HTMLButtonElement | null;
  const redoHandler = () => editor.redo();
  addListener(redoBtn, "click", redoHandler);

  const saveBtn = document.getElementById("save") as HTMLButtonElement | null;
  const saveHandler = () => {
    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = "canvas.png";
    a.click();
  };
  addListener(saveBtn, "click", saveHandler);


      shortcuts.destroy();
      editor.destroy();
    },
  };
}

