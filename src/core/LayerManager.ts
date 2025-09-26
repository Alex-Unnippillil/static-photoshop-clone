import { Editor } from "./Editor.js";

interface LayerEntry {
  canvas: HTMLCanvasElement;
  editor: Editor;
  name: string;
  option: HTMLOptionElement | null;
  opacityGroup: HTMLDivElement | null;
  opacityInput: HTMLInputElement | null;
  opacityLabel: HTMLLabelElement | null;
  cleanup?: () => void;
}

export interface LayerManagerOptions {
  canvases: HTMLCanvasElement[];
  canvasContainer: HTMLElement;
  toolbar: HTMLElement;
  layerSelect: HTMLSelectElement | null;
  colorPicker: HTMLInputElement;
  lineWidth: HTMLInputElement;
  fillMode: HTMLInputElement;
  onHistoryChange: () => void;
  fontFamily?: HTMLSelectElement | null;
  fontSize?: HTMLInputElement | null;
}

/**
 * Handles dynamic creation, destruction and metadata for editor layers.
 */
export class LayerManager {
  readonly editors: Editor[] = [];
  private layers: LayerEntry[] = [];
  private activeIndex = 0;
  private readonly options: LayerManagerOptions;

  constructor(options: LayerManagerOptions) {
    this.options = options;
    this.options.layerSelect?.replaceChildren();
    options.canvases.forEach((canvas) => {
      this.addCanvas(canvas, canvas.dataset.layerName || canvas.id);
    });
    if (this.layers.length === 0) {
      throw new Error(
        "LayerManager requires at least one canvas element with a 2D context",
      );
    }
    this.activateLayer(0);
  }

  get length(): number {
    return this.layers.length;
  }

  get activeLayerIndex(): number {
    return this.activeIndex;
  }

  get activeEditor(): Editor {
    return this.layers[this.activeIndex].editor;
  }

  get layerNames(): string[] {
    return this.layers.map((layer) => layer.name);
  }

  createLayer(name?: string): number {
    const base = this.layers[0].canvas;
    const canvas = document.createElement("canvas");
    canvas.width = base.width;
    canvas.height = base.height;
    canvas.style.width = base.style.width;
    canvas.style.height = base.style.height;
    canvas.dataset.layerName = name ?? "";
    this.options.canvasContainer.appendChild(canvas);
    const idx = this.addCanvas(canvas, name);
    if (idx === null) {
      return this.activeIndex;
    }
    this.activateLayer(idx);
    return idx;
  }

  removeLayer(index: number): boolean {
    if (this.layers.length <= 1) {
      return false;
    }
    if (index < 0 || index >= this.layers.length) {
      return false;
    }
    const [removed] = this.layers.splice(index, 1);
    const editorIndex = this.editors.indexOf(removed.editor);
    if (editorIndex !== -1) {
      this.editors.splice(editorIndex, 1);
    }
    removed.editor.destroy();
    removed.canvas.remove();
    removed.option?.remove();
    removed.opacityGroup?.remove();
    removed.cleanup?.();
    this.refreshLayerMetadata();
    if (this.activeIndex >= this.layers.length) {
      this.activeIndex = this.layers.length - 1;
    }
    this.activateLayer(this.activeIndex);
    return true;
  }

  renameLayer(index: number, newName: string) {
    const layer = this.layers[index];
    if (!layer) return;
    layer.name = newName;
    layer.canvas.dataset.layerName = newName;
    if (layer.option) {
      layer.option.textContent = newName;
    }
    if (layer.opacityLabel) {
      layer.opacityLabel.textContent = `${newName} Opacity`;
    }
  }

  activateLayer(index: number): boolean {
    if (index < 0 || index >= this.layers.length) return false;
    this.activeIndex = index;
    this.layers.forEach((layer, i) => {
      layer.canvas.style.pointerEvents = i === index ? "auto" : "none";
    });
    if (this.options.layerSelect) {
      this.options.layerSelect.value = String(index);
    }
    return true;
  }

  destroy() {
    this.layers.forEach((layer) => {
      layer.editor.destroy();
      layer.cleanup?.();
    });
    this.layers = [];
    this.editors.length = 0;
  }

  private addCanvas(canvas: HTMLCanvasElement, name?: string): number | null {
    const layerName =
      name && name.trim().length > 0
        ? name
        : `Layer ${this.layers.length + 1}`;
    const editor = this.instantiateEditor(canvas);
    if (!editor) return null;
    const option = this.options.layerSelect
      ? document.createElement("option")
      : null;
    if (option) {
      option.value = String(this.layers.length);
      option.textContent = layerName;
      this.options.layerSelect!.appendChild(option);
    }
    const opacity = this.layers.length === 0 ? null : this.createOpacityControls(canvas, layerName);

    const entry: LayerEntry = {
      canvas,
      editor,
      name: layerName,
      option,
      opacityGroup: opacity?.group ?? null,
      opacityInput: opacity?.input ?? null,
      opacityLabel: opacity?.label ?? null,
      cleanup: opacity?.cleanup,
    };
    canvas.dataset.layerName = layerName;
    this.layers.push(entry);
    this.editors.push(editor);
    this.refreshLayerMetadata();
    return this.layers.length - 1;
  }

  private instantiateEditor(canvas: HTMLCanvasElement): Editor | null {
    try {
      return new Editor(
        canvas,
        this.options.colorPicker,
        this.options.lineWidth,
        this.options.fillMode,
        this.options.onHistoryChange,
        this.options.fontFamily ?? undefined,
        this.options.fontSize ?? undefined,
      );
    } catch {
      canvas.remove();
      return null;
    }
  }

  private createOpacityControls(canvas: HTMLCanvasElement, name: string) {
    const id = `${canvas.id || `layer${Date.now()}`}Opacity`;
    const existing = document.getElementById(id) as HTMLInputElement | null;
    let group: HTMLDivElement | null = null;
    let label: HTMLLabelElement | null = null;
    let input: HTMLInputElement;

    if (existing) {
      input = existing;
      input.type = "number";
      input.min = input.min || "0";
      input.max = input.max || "100";
      input.value = input.value || "100";
      label = existing.previousElementSibling instanceof HTMLLabelElement
        ? existing.previousElementSibling
        : null;
      if (label) {
        label.htmlFor = id;
        label.textContent = `${name} Opacity`;
      }
      group = existing.closest(".group") as HTMLDivElement | null;
    } else {
      group = document.createElement("div");
      group.className = "group";

      label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = `${name} Opacity`;

      input = document.createElement("input");
      input.id = id;
      input.type = "number";
      input.min = "0";
      input.max = "100";
      input.value = "100";
      group.appendChild(label);
      group.appendChild(input);
      this.options.toolbar.appendChild(group);
    }

    const handler = () => {
      const value = parseFloat(input.value);
      canvas.style.opacity = isNaN(value) ? "1" : String(value / 100);
    };
    input.addEventListener("input", handler);

    return {
      group,
      input,
      label,
      cleanup: () => input.removeEventListener("input", handler),
    };
  }

  private refreshLayerMetadata() {
    this.layers.forEach((layer, index) => {
      if (layer.option) {
        layer.option.value = String(index);
      }
      if (layer.opacityLabel) {
        layer.opacityLabel.textContent = `${layer.name} Opacity`;
      }
      layer.canvas.style.zIndex = String(index);
    });
    if (this.options.layerSelect) {
      this.options.layerSelect.value = String(this.activeIndex);
    }
  }
}

