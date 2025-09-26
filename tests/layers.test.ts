import { LayerManager } from "../src/core/LayerManager.js";
import type { Editor } from "../src/core/Editor.js";

describe("LayerManager", () => {
  let canvases: HTMLCanvasElement[];
  let toolbar: HTMLDivElement;
  let layerSelect: HTMLSelectElement;
  let onActivate: jest.Mock;
  let manager: LayerManager;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="toolbar"></div>
      <select id="layerSelect"></select>
      <canvas id="c1"></canvas>
      <canvas id="c2"></canvas>
    `;

    canvases = Array.from(document.querySelectorAll("canvas"));
    toolbar = document.getElementById("toolbar") as HTMLDivElement;
    layerSelect = document.getElementById("layerSelect") as HTMLSelectElement;
    onActivate = jest.fn();

    const stubEditors = canvases.map(() => ({}) as Editor);
    manager = new LayerManager({
      layers: canvases.map((canvas, index) => ({
        canvas,
        editor: stubEditors[index],
      })),
      layerSelect,
      toolbar,
      onActivate,
    });
  });

  afterEach(() => manager.destroy());

  it("activates layers and updates pointer events", () => {
    expect(manager.getActiveIndex()).toBe(0);
    expect(canvases[0].style.pointerEvents).toBe("auto");
    expect(canvases[1].style.pointerEvents).toBe("none");

    manager.activateLayer(1);

    expect(manager.getActiveIndex()).toBe(1);
    expect(canvases[0].style.pointerEvents).toBe("none");
    expect(canvases[1].style.pointerEvents).toBe("auto");
    expect(layerSelect.value).toBe("1");
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledWith(expect.any(Object), 1);
  });

  it("creates opacity controls and updates canvas opacity", () => {
    const opacityInput = document.getElementById("c2Opacity") as HTMLInputElement;
    expect(opacityInput).toBeTruthy();

    opacityInput.value = "50";
    opacityInput.dispatchEvent(new Event("input"));

    expect(canvases[1].style.opacity).toBe("0.5");
  });

  it("hides layers and falls back to the next visible layer", () => {
    manager.activateLayer(1);
    expect(onActivate).toHaveBeenLastCalledWith(expect.any(Object), 1);

    manager.setLayerVisibility(1, false);

    expect(canvases[1].style.display).toBe("none");
    expect(manager.getActiveIndex()).toBe(0);
    expect(onActivate).toHaveBeenLastCalledWith(expect.any(Object), 0);
  });
});

