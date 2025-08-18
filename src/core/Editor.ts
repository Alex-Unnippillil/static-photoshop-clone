import { Tool } from "../tools/Tool.js";

export class Editor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private currentTool: Tool | null = null;
  colorPicker: HTMLInputElement;
  lineWidth: HTMLInputElement;
  fillMode: HTMLInputElement;
  private onChange?: () => void;
  /** current zoom level */
  public scale = 1;
  /** current pan offset on the x axis */
  public translateX = 0;
  /** current pan offset on the y axis */
  public translateY = 0;
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;
  private dpr = window.devicePixelRatio || 1;

  constructor(
    canvas: HTMLCanvasElement,
    colorPicker: HTMLInputElement,
    lineWidth: HTMLInputElement,
    fillMode: HTMLInputElement,
    onChange?: () => void,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to get 2D context");
    this.ctx = ctx;
    this.colorPicker = colorPicker;
    this.lineWidth = lineWidth;
    this.fillMode = fillMode;
    this.onChange = onChange;
    this.adjustForPixelRatio();
    window.addEventListener("resize", this.handleResize);

    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  setTool(tool: Tool) {
    this.currentTool?.destroy?.();
    this.currentTool = tool;
    this.canvas.style.cursor = tool.cursor || "crosshair";
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button === 1 || e.button === 2) {
      // middle or right click pans the canvas
      e.preventDefault();
      this.canvas.setPointerCapture(e.pointerId);
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      return;
    }
    // Capture the pointer once before recording canvas state
    this.canvas.setPointerCapture(e.pointerId);
    this.saveState();
    this.currentTool?.onPointerDown(e, this);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.isPanning) {
      const dx = e.clientX - this.lastPanX;
      const dy = e.clientY - this.lastPanY;
      this.pan(dx, dy);
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      return;
    }
    this.currentTool?.onPointerMove(e, this);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.releasePointerCapture(e.pointerId);
      return;
    }
    this.currentTool?.onPointerUp(e, this);
    this.canvas.releasePointerCapture(e.pointerId);
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const x = (offsetX - this.translateX) / this.scale;
    const y = (offsetY - this.translateY) / this.scale;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    this.translateX = offsetX - x * factor;
    this.translateY = offsetY - y * factor;
    this.scale *= factor;
    this.applyTransform();
  };

  private adjustForPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = dpr;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.applyTransform();
  }

  private handleResize = () => {
    const data = this.canvas.toDataURL();
    this.adjustForPixelRatio();
    const img = new Image();
    img.src = data;
    img.onload = () => {
      this.ctx.drawImage(
        img,
        0,
        0,
        this.canvas.clientWidth,
        this.canvas.clientHeight,
      );
    };
  };

  getSnapshot(): ImageData {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
    return data;
  }

  putSnapshot(data: ImageData): void {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(data, 0, 0);
    this.ctx.restore();
  }

  saveState() {
    this.undoStack.push(this.getSnapshot());
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack.length = 0;
    this.onChange?.();
  }

  private restoreState(stack: ImageData[], opposite: ImageData[]) {
    if (!stack.length) return;
    opposite.push(this.getSnapshot());
    const imageData = stack.pop()!;
    this.putSnapshot(imageData);
    this.onChange?.();
  }

  undo() {
    this.restoreState(this.undoStack, this.redoStack);
  }

  redo() {
    this.restoreState(this.redoStack, this.undoStack);
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  get strokeStyle() {
    return this.colorPicker.value;
  }

  get lineWidthValue() {
    return parseInt(this.lineWidth.value, 10) || 1;
  }

  get fill() {
    return this.fillMode.checked;
  }

  get fillStyle() {
    return this.colorPicker.value;
  }

  /** Convert a pointer event's coordinates into canvas space accounting for transforms. */
  getCanvasPoint(e: PointerEvent) {
    return {
      x: (e.offsetX - this.translateX) / this.scale,
      y: (e.offsetY - this.translateY) / this.scale,
    };
  }

  /** Adjust the current zoom level. */
  zoom(factor: number) {
    this.scale *= factor;
    this.applyTransform();
  }

  /** Translate the canvas view. */
  pan(dx: number, dy: number) {
    this.translateX += dx;
    this.translateY += dy;
    this.applyTransform();
  }

  private applyTransform() {
    this.ctx.setTransform(
      this.scale * this.dpr,
      0,
      0,
      this.scale * this.dpr,
      this.translateX * this.dpr,
      this.translateY * this.dpr,
    );
  }

  /**
   * Remove all event listeners registered by the editor.
   * Should be called before discarding the instance to prevent leaks.
   */
  destroy(): void {
    this.currentTool?.destroy?.();
    window.removeEventListener("resize", this.handleResize);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }
}
