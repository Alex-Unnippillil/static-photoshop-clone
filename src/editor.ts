import { Editor } from "./core/Editor";
// @ts-ignore missing exports in incomplete tool modules
import { PencilTool } from "./tools/PencilTool";
// @ts-ignore missing exports in incomplete tool modules
import { RectangleTool } from "./tools/RectangleTool";
// @ts-ignore missing exports in incomplete tool modules
import { LineTool } from "./tools/LineTool";
// @ts-ignore missing exports in incomplete tool modules
import { CircleTool } from "./tools/CircleTool";
// @ts-ignore missing exports in incomplete tool modules
import { TextTool } from "./tools/TextTool";
// @ts-ignore missing exports in incomplete tool modules
import { EraserTool } from "./tools/EraserTool";

export function initEditor() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const colorPicker = document.getElementById("colorPicker") as HTMLInputElement;
  const lineWidth = document.getElementById("lineWidth") as HTMLInputElement;

  const editor = new Editor(canvas, colorPicker, lineWidth);

  const tools = {
    pencil: new PencilTool(),
    rectangle: new RectangleTool(),
    line: new LineTool(),
    circle: new CircleTool(),
    text: new TextTool(),
    eraser: new EraserTool(),
  } as const;

  (document.getElementById("pencil") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => editor.setTool(tools.pencil),
  );
  (document.getElementById("rectangle") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => editor.setTool(tools.rectangle),
  );
  (document.getElementById("line") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => editor.setTool(tools.line),
  );
  (document.getElementById("circle") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => editor.setTool(tools.circle),
  );
  (document.getElementById("text") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => editor.setTool(tools.text),
  );
  (document.getElementById("eraser") as HTMLButtonElement | null)?.addEventListener(
    "click",
    () => editor.setTool(tools.eraser),
  );

  const saveButton = document.getElementById("save") as HTMLButtonElement | null;
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "drawing.png";
      link.click();
    });
  }

  const addLayerBtn = document.getElementById("addLayer") as HTMLButtonElement | null;
  const removeLayerBtn = document.getElementById("removeLayer") as HTMLButtonElement | null;
  const layersList = document.getElementById("layersList") as HTMLUListElement | null;

  function refreshLayers() {
    if (!layersList) return;
    layersList.innerHTML = "";
    editor.layers.forEach((_, index) => {
      const li = document.createElement("li");
      li.textContent = `Layer ${index + 1}`;
      if (index === editor.activeLayerIndex) li.classList.add("active");
      li.addEventListener("click", () => {
        editor.setActiveLayer(index);
        refreshLayers();
      });
      layersList.appendChild(li);
    });
  }

  addLayerBtn?.addEventListener("click", () => {
    editor.addLayer();
    refreshLayers();
  });

  removeLayerBtn?.addEventListener("click", () => {
    editor.removeLayer(editor.activeLayerIndex);
    refreshLayers();
  });

  refreshLayers();

  return { destroy: () => editor.destroy(), editor };
}

