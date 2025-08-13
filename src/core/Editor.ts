import { Tool } from "../tools/Tool";
import { Layer } from "./Layer";

export class Editor {
  canvas: HTMLCanvasElement;
  private displayCtx: CanvasRenderingContext2D;
  layers: Layer[] = [];
  activeLayerIndex = 0;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private currentTool: Tool | null = null;
  colorPicker: HTMLInputElement;
  lineWidth: HTMLInputElement;

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

  setTool(tool: Tool) {
    this.currentTool = tool;
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.saveState();
    this.currentTool?.onPointerDown(e, this);
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
      layer.canvas.width = this.canvas.width;
      layer.canvas.height = this.canvas.height;
    }
  }

  private handleResize = () => {
    const data = this.canvas.toDataURL();
    this.adjustForPixelRatio();
    const img = new Image();
    img.src = data;
    img.onload = () => {
      this.displayCtx.drawImage(
        img,
        0,
        0,
        this.canvas.clientWidth,
        this.canvas.clientHeight,
      );
    };
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
    this.render();
    opposite.push(
      this.displayCtx.getImageData(0, 0, this.canvas.width, this.canvas.height),
    );
    const imageData = stack.pop()!;
    this.displayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.displayCtx.putImageData(imageData, 0, 0);
    const base = new Layer(this.canvas.width, this.canvas.height);
    base.ctx.putImageData(imageData, 0, 0);
    this.layers = [base];
    this.activeLayerIndex = 0;
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

  get ctx(): CanvasRenderingContext2D {
    return this.layers[this.activeLayerIndex].ctx;
  }

  addLayer() {
    const layer = new Layer(this.canvas.width, this.canvas.height);
    this.layers.push(layer);
    this.activeLayerIndex = this.layers.length - 1;
    this.render();
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
    if (index < 0 || index >= this.layers.length) return;
    this.activeLayerIndex = index;
  }

  private render() {
    this.displayCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const layer of this.layers) {
      this.displayCtx.drawImage(layer.canvas, 0, 0);
    }
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
