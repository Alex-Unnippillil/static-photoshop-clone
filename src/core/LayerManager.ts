import type { Editor } from "./Editor.js";

interface LayerEntry {
  canvas: HTMLCanvasElement;
  editor: Editor;
  name: string;
  visible: boolean;
}

export interface LayerManagerOptions {
  layers: Array<{ canvas: HTMLCanvasElement; editor: Editor; name?: string }>;
  layerSelect?: HTMLSelectElement | null;
  toolbar?: HTMLElement | null;
  onActivate?: (editor: Editor, index: number) => void;
}

/**
 * Manages editor layers including activation state, ordering, and visibility.
 */
export class LayerManager {
  private readonly layers: LayerEntry[];
  private activeIndex = 0;
  private readonly layerSelect?: HTMLSelectElement | null;
  private readonly toolbar?: HTMLElement | null;
  private readonly onActivate?: (editor: Editor, index: number) => void;
  private readonly cleanup: Array<() => void> = [];

  constructor({ layers, layerSelect, toolbar, onActivate }: LayerManagerOptions) {
    if (layers.length === 0) {
      throw new Error("LayerManager requires at least one layer");
    }

    this.layers = layers.map((layer, index) => ({
      canvas: layer.canvas,
      editor: layer.editor,
      name: layer.name ?? (layer.canvas.id || `Layer ${index + 1}`),
      visible: true,
    }));
    this.layerSelect = layerSelect ?? undefined;
    this.toolbar = toolbar ?? undefined;
    this.onActivate = onActivate;

    this.populateLayerSelect();
    this.createOpacityControls();
    this.updateLayerVisibility();
    this.updateLayerInteractivity();
    this.selectActiveLayerOption();
  }

  get activeLayer(): LayerEntry {
    return this.layers[this.activeIndex];
  }

  get activeEditor(): Editor {
    return this.activeLayer.editor;
  }

  get count(): number {
    return this.layers.length;
  }

  getActiveIndex(): number {
    return this.activeIndex;
  }

  getLayers(): readonly LayerEntry[] {
    return this.layers;
  }

  activateLayer(index: number): void {
    if (index < 0 || index >= this.layers.length || index === this.activeIndex) {
      return;
    }

    this.activeIndex = index;
    this.updateLayerInteractivity();
    this.selectActiveLayerOption();
    this.notifyActivation();
  }

  setLayerVisibility(index: number, visible: boolean): void {
    const layer = this.layers[index];
    if (!layer) return;
    if (layer.visible === visible) return;

    layer.visible = visible;
    this.updateLayerVisibility();
    this.updateLayerInteractivity();

    if (!visible && this.activeIndex === index) {
      const nextVisible = this.layers.findIndex((entry) => entry.visible);
      if (nextVisible !== -1) {
        this.activeIndex = nextVisible;
        this.selectActiveLayerOption();
        this.notifyActivation();
      }
    }
  }

  destroy(): void {
    while (this.cleanup.length) {
      const dispose = this.cleanup.pop();
      dispose?.();
    }
  }

  private populateLayerSelect(): void {
    if (!this.layerSelect) return;

    this.layerSelect.innerHTML = "";
    this.layers.forEach((layer, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = layer.name;
      this.layerSelect!.appendChild(option);
    });

    const handler = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      const idx = parseInt(target.value, 10);
      if (!Number.isNaN(idx)) {
        this.activateLayer(idx);
      }
    };

    this.layerSelect.addEventListener("change", handler);
    this.cleanup.push(() => this.layerSelect?.removeEventListener("change", handler));
  }

  private createOpacityControls(): void {
    if (!this.toolbar) return;

    this.layers.forEach((layer, index) => {
      if (index === 0) return;

      const canvasId = layer.canvas.id || `layer${index + 1}`;
      let input = document.getElementById(`${canvasId}Opacity`) as
        | HTMLInputElement
        | null;

      if (!input) {
        const group = document.createElement("div");
        group.className = "group";

        const label = document.createElement("label");
        label.htmlFor = `${canvasId}Opacity`;
        label.textContent = `${layer.name} Opacity`;

        input = document.createElement("input");
        input.id = `${canvasId}Opacity`;
        input.type = "number";
        input.min = "0";
        input.max = "100";
        input.value = "100";

        group.appendChild(label);
        group.appendChild(input);
        this.toolbar!.appendChild(group);
      }

      const handler = () => {
        const value = parseFloat(input.value);
        layer.canvas.style.opacity = Number.isNaN(value)
          ? "1"
          : String(Math.max(0, Math.min(100, value)) / 100);
      };
      input.addEventListener("input", handler);
      this.cleanup.push(() => input.removeEventListener("input", handler));
    });
  }

  private updateLayerInteractivity(): void {
    this.layers.forEach((layer, index) => {
      const isActive = index === this.activeIndex && layer.visible;
      layer.canvas.style.pointerEvents = isActive ? "auto" : "none";
    });
  }

  private updateLayerVisibility(): void {
    this.layers.forEach((layer) => {
      layer.canvas.style.display = layer.visible ? "" : "none";
    });
  }

  private selectActiveLayerOption(): void {
    if (!this.layerSelect) return;
    this.layerSelect.value = String(this.activeIndex);
  }

  private notifyActivation(): void {
    if (this.onActivate) {
      this.onActivate(this.layers[this.activeIndex].editor, this.activeIndex);
    }
  }
}
