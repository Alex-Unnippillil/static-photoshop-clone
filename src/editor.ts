import { Editor } from "./core/Editor";
import { Shortcuts } from "./core/Shortcuts";
import { PencilTool } from "./tools/PencilTool";
import { EraserTool } from "./tools/EraserTool";
import { RectangleTool } from "./tools/RectangleTool";
import { LineTool } from "./tools/LineTool";
import { CircleTool } from "./tools/CircleTool";
import { TextTool } from "./tools/TextTool";



  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;
  const fillMode = document.getElementById("fillMode") as HTMLInputElement;



  const listeners: Array<() => void> = [];

  function addListener<K extends keyof HTMLElementEventMap>(
    el: HTMLElement | null,
    type: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => void,
  ) {
    if (!el) return;
    el.addEventListener(type, handler as EventListener);
    listeners.push(() => el.removeEventListener(type, handler as EventListener));
  }



  addListener(saveBtn, "click", () => saveAs("image/png", "canvas.png"));
  addListener(saveJpegBtn, "click", () => saveAs("image/jpeg", "canvas.jpg"));

  function loadImage(src: string) {
    const img = new Image();
    img.onload = () => {
      editor.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = src;
  }

  addListener(imageLoader, "change", (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      loadImage(result);
    };
    reader.readAsDataURL(file);
  });

  // Support drag & drop image loading
  addListener(canvas, "dragover", (e: DragEvent) => {
    e.preventDefault();
  });
  addListener(canvas, "drop", (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      loadImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  });

  return {
    editor,
    destroy: () => {
      listeners.forEach((fn) => fn());
      shortcuts.destroy();
      editor.destroy();
    },
  };
}

