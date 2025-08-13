import { Editor } from "./core/Editor";
import { initShortcuts, ShortcutHandle } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { RectangleTool } from "./tools/RectangleTool";
import { EraserTool } from "./tools/EraserTool";

export interface EditorHandle {
  editor: Editor;
  destroy: () => void;
}

export function initEditor(): EditorHandle {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const pencil = new PencilTool();
  const rectangle = new RectangleTool();
  const eraser = new EraserTool();
  editor.setTool(pencil);

  const listeners: Array<{ el: Element; type: string; fn: EventListener }> = [];

  function bind(el: Element | null, type: string, fn: EventListener) {
    if (!el) return;
    el.addEventListener(type, fn);
    listeners.push({ el, type, fn });
  }

  bind(document.getElementById("pencil"), "click", () => editor.setTool(pencil));
  bind(document.getElementById("rectangle"), "click", () => editor.setTool(rectangle));
  bind(document.getElementById("eraser"), "click", () => editor.setTool(eraser));

  const imageLoader = document.getElementById("imageLoader") as HTMLInputElement | null;
  const onImage = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        editor.ctx.drawImage(img, 0, 0);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  bind(imageLoader, "change", onImage);

  const saveButton = document.getElementById("save") as HTMLButtonElement | null;
  const onSave = () => {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "canvas.png";
    link.click();
  };
  bind(saveButton, "click", onSave);

  const shortcuts: ShortcutHandle = initShortcuts(editor, { pencil, rectangle });

  function destroy() {
    editor.destroy();
    listeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
    shortcuts.destroy();
  }

  return { editor, destroy };
}
