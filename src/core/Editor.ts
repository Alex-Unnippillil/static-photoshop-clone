import { Tool } from "../tools/Tool";
import { Layer } from "./Layer";

export class Editor {
  canvas: HTMLCanvasElement;
  private displayCtx: CanvasRenderingContext2D;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private currentTool: Tool | null = null;
  colorPicker: HTMLInputElement;
  lineWidth: HTMLInputElement;
  layers: Layer[] = [];
  activeLayerIndex = 0;

  constructor(
    canvas: HTMLCanvasElement,
    colorPicker: HTMLInputElement,
    lineWidth: HTMLInputElement,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to get 2D context");
    this.displayCtx = ctx;
    this.colorPicker = colorPicker;
    this.lineWidth = lineWidth;

    this.adjustForPixelRatio();
    this.addLayer();

    window.addEventListener("resize", this.handleResize);
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
  }

  get ctx() {
    return this.layers[this.activeLayerIndex].ctx;
  }

  setTool(tool: Tool) {
    this.currentTool = tool;
  }

  addLayer() {
    const layer = new Layer(this.canvas.width, this.canvas.height);
    const dpr = window.devicePixelRatio || 1;
    layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
    layer.ctx.scale(dpr, dpr);
    this.layers.push(layer);
    return layer;
  }

  removeLayer(index: number) {
    if (this.layers.length <= 1) return;
    this.layers.splice(index, 1);
    if (this.activeLayerIndex >= this.layers.length) {
      this.activeLayerIndex = this.layers.length - 1;
    }
    this.render();
  }

  setActiveLayer(index: number) {
    if (index >= 0 && index < this.layers.length) {
      this.activeLayerIndex = index;
    }
  }

  render() {
    this.displayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const layer of this.layers) {
      this.displayCtx.drawImage(layer.canvas, 0, 0);
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.saveState();
    this.currentTool?.onPointerDown(e, this);
    this.render();
  };

  private handlePointerMove = (e: PointerEvent) => {
    this.currentTool?.onPointerMove(e, this);
    this.render();
  };

  private handlePointerUp = (e: PointerEvent) => {
    this.currentTool?.onPointerUp(e, this);
    this.render();
  };

  private adjustForPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.displayCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.displayCtx.scale(dpr, dpr);
    for (const layer of this.layers) {
      layer.canvas.width = rect.width * dpr;
      layer.canvas.height = rect.height * dpr;
      layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
      layer.ctx.scale(dpr, dpr);
    }
  }

  private handleResize = () => {
    this.adjustForPixelRatio();
    this.render();
  };

  saveState() {
    this.render();
    this.undoStack.push(
      this.displayCtx.getImageData(0, 0, this.canvas.width, this.canvas.height),
    );
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  private restoreState(stack: ImageData[], opposite: ImageData[]) {
    if (!stack.length) return;
    opposite.push(
      this.displayCtx.getImageData(0, 0, this.canvas.width, this.canvas.height),
    );
    const imageData = stack.pop()!;
    this.displayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.displayCtx.putImageData(imageData, 0, 0);
  }

  undo() {
    this.restoreState(this.undoStack, this.redoStack);
  }

  redo() {
    this.restoreState(this.redoStack, this.undoStack);
  }

  get strokeStyle() {
    return this.colorPicker.value;
  }

  get lineWidthValue() {
    return parseInt(this.lineWidth.value, 10) || 1;
  }

  /**
   * Remove all event listeners registered by the editor.
   * Should be called before discarding the instance to prevent leaks.
   */
  destroy(): void {
    window.removeEventListener("resize", this.handleResize);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
  }
}
