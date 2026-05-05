import type { Editor } from "../core/Editor.js";
import { listen, optionalElement, type Cleanup } from "./domHelpers.js";

export interface LayerControlsInput {
  canvases: HTMLCanvasElement[];
  editors: Editor[];
  toolbar: HTMLElement;
  getActiveLayerIndex: () => number;
  setActiveLayerIndex: (index: number) => void;
  onLayerSelected: (index: number) => void;
  cleanups: Cleanup[];
}

export interface LayerControlsOutput {
  updateLayerInteractivity: () => void;
  syncLayerSelect: (index: number) => void;
  destroy: Cleanup;
}

export function initLayerControls(input: LayerControlsInput): LayerControlsOutput {
  const layerSelect = optionalElement<HTMLSelectElement>("layerSelect");
  if (layerSelect) layerSelect.innerHTML = "";

  input.canvases.forEach((c, i) => {
    const canvasId = c.id || `layer${i + 1}`;
    const name = c.id || `Layer ${i + 1}`;
    if (layerSelect) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = name;
      layerSelect.appendChild(opt);
    }
    if (!document.getElementById(`${canvasId}Opacity`) && i > 0) {
      const group = document.createElement("div");
      group.className = "group";
      const label = document.createElement("label");
      label.htmlFor = `${canvasId}Opacity`;
      label.textContent = `${name} Opacity`;
      const opacity = document.createElement("input");
      opacity.id = `${canvasId}Opacity`;
      opacity.type = "number";
      opacity.min = "0";
      opacity.max = "100";
      opacity.value = "100";
      group.append(label, opacity);
      input.toolbar.appendChild(group);
    }
  });

  const updateLayerInteractivity = () => {
    input.canvases.forEach((canvas, index) => {
      canvas.style.pointerEvents = index === input.getActiveLayerIndex() ? "auto" : "none";
    });
  };

  listen(layerSelect, "change", () => {
    input.onLayerSelected(parseInt(layerSelect!.value, 10));
  }, input.cleanups);

  document.querySelectorAll<HTMLInputElement>('input[id$="Opacity"]').forEach((opacityInput) => {
    const layer = document.getElementById(opacityInput.id.replace(/Opacity$/, "")) as HTMLCanvasElement | null;
    if (!layer) return;
    listen(opacityInput, "input", () => {
      const value = parseFloat(opacityInput.value);
      layer.style.opacity = isNaN(value) ? "1" : String(value / 100);
    }, input.cleanups);
  });

  return {
    updateLayerInteractivity,
    syncLayerSelect: (index) => {
      if (layerSelect) layerSelect.value = String(index);
    },
    destroy: () => {},
  };
}
