import { Editor } from "./core/Editor";
import { PencilTool } from "./tools/PencilTool";

export function initEditor() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);
  editor.setTool(new PencilTool());

  const addLayer = document.getElementById("addLayer") as HTMLButtonElement;
  const deleteLayer = document.getElementById("deleteLayer") as HTMLButtonElement;
  const layerSelect = document.getElementById(
    "layerSelect",
  ) as HTMLSelectElement;

  const refresh = () => {
    if (!layerSelect) return;
    layerSelect.innerHTML = "";
    editor.layers.forEach((_layer, i) => {
      const option = document.createElement("option");
      option.value = i.toString();
      option.textContent = `Layer ${i + 1}`;
      if (i === editor.activeLayerIndex) option.selected = true;
      layerSelect.appendChild(option);
    });
  };

  addLayer?.addEventListener("click", () => {
    editor.addLayer();
    refresh();
  });

  deleteLayer?.addEventListener("click", () => {
    const index = layerSelect.selectedIndex;
    editor.removeLayer(index);
    refresh();
  });

  layerSelect?.addEventListener("change", () => {
    const index = parseInt(layerSelect.value, 10);
    editor.setActiveLayer(index);
    refresh();
  });

  refresh();
  return editor;
}

