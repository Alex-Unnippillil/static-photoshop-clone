import type { Editor } from "../core/Editor.js";
import { listen, optionalElement, type Cleanup } from "./domHelpers.js";

export interface ImageImportInput {
  getEditor: () => Editor;
  onImported: () => void;
  cleanups: Cleanup[];
}

export function initImageImport({ getEditor, onImported, cleanups }: ImageImportInput): Cleanup {
  const imageLoader = optionalElement<HTMLInputElement>("imageLoader");
  listen(imageLoader, "change", (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const editor = getEditor();
        editor.saveState();
        editor.ctx.drawImage(img, 0, 0, editor.canvas.width, editor.canvas.height);
        onImported();
        if (imageLoader) imageLoader.value = "";
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, cleanups);
  return () => {};
}
