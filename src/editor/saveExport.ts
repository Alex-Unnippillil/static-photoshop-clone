import type { Editor } from "../core/Editor.js";
import { listen, requireElement, type Cleanup } from "./domHelpers.js";

export interface SaveExportInput {
  canvases: HTMLCanvasElement[];
  getEditor: () => Editor;
  cleanups: Cleanup[];
}

export function initSaveExport({ canvases, getEditor, cleanups }: SaveExportInput): Cleanup {
  const saveBtn = requireElement<HTMLButtonElement>("save", "button");
  const formatSelect = requireElement<HTMLSelectElement>("formatSelect", "select");
  listen(saveBtn, "click", () => {
    const format = formatSelect.value.toLowerCase() === "jpeg" ? "jpeg" : "png";
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    const quality = format === "jpeg" ? 0.9 : undefined;
    let exportCanvas: HTMLCanvasElement;
    if (canvases.length > 1) {
      exportCanvas = document.createElement("canvas");
      exportCanvas.width = canvases[0].width;
      exportCanvas.height = canvases[0].height;
      const ctx = exportCanvas.getContext("2d")!;
      canvases.forEach((cv) => {
        ctx.globalAlpha = parseFloat(cv.style.opacity) || 1;
        ctx.drawImage(cv, 0, 0);
      });
      ctx.globalAlpha = 1;
    } else {
      exportCanvas = getEditor().canvas;
    }
    const data = quality !== undefined ? exportCanvas.toDataURL(mime, quality) : exportCanvas.toDataURL(mime);
    const a = document.createElement("a");
    a.href = data;
    a.download = `canvas.${format === "jpeg" ? "jpg" : "png"}`;
    a.click();
  }, cleanups);
  return () => {};
}
