import { initLayerControls } from "../src/editor/layerControls.js";

test("layer controls set pointerEvents by active layer", () => {
  document.body.innerHTML = `<div id='toolbar'></div><select id='layerSelect'></select><canvas id='c1'></canvas><canvas id='c2'></canvas>`;
  const canvases = Array.from(document.querySelectorAll("canvas"));
  const out = initLayerControls({ canvases: canvases as any, editors: [] as any, toolbar: document.getElementById("toolbar")!, getActiveLayerIndex: () => 1, setActiveLayerIndex: () => {}, onLayerSelected: () => {}, cleanups: [] });
  out.updateLayerInteractivity();
  expect((canvases[0] as HTMLCanvasElement).style.pointerEvents).toBe("none");
  expect((canvases[1] as HTMLCanvasElement).style.pointerEvents).toBe("auto");
});
