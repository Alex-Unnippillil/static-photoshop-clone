import { Tool } from "../tools/Tool.js";

export class Editor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  zoom = 1;
  offsetX = 0;
  offsetY = 0;
  private dpr = window.devicePixelRatio || 1;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private currentTool: Tool | null = null;
  colorPicker: HTMLInputElement;
  lineWidth: HTMLInputElement;
  fillMode: HTMLInputElement;
  fontFamily: HTMLSelectElement | null;
  fontSize: HTMLInputElement | null;
  private onChange?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    colorPicker: HTMLInputElement,
    lineWidth: HTMLInputElement,
    fillMode: HTMLInputElement,
    onChange?: () => void,
    fontFamily?: HTMLSelectElement | null,
    fontSize?: HTMLInputElement | null,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to get 2D context");
    this.ctx = ctx;
    this.colorPicker = colorPicker;
    this.lineWidth = lineWidth;
    this.fillMode = fillMode;
    this.onChange = onChange;
    this.fontFamily = fontFamily ?? null;
    this.fontSize = fontSize ?? null;
    this.adjustForPixelRatio();
    this.canvas.style.transformOrigin = "0 0";
    this.updateCanvasTransform();
    window.addEventListener("resize", this.handleResize);

    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
  }

  setTool(tool: Tool) {
    this.currentTool?.destroy?.();
    this.currentTool = tool;
    this.canvas.style.cursor = tool.cursor || "crosshair";
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    // Capture the pointer once before recording canvas state
    this.canvas.setPointerCapture(e.pointerId);
    this.saveState();
    const ev = this.transformEvent(e);
    this.withContext(() => this.currentTool?.onPointerDown(ev, this));
  };

  private handlePointerMove = (e: PointerEvent) => {
    const ev = this.transformEvent(e);
    this.withContext(() => this.currentTool?.onPointerMove(ev, this));
  };

  private handlePointerUp = (e: PointerEvent) => {
    const ev = this.transformEvent(e);
    this.withContext(() => this.currentTool?.onPointerUp(ev, this));
    this.canvas.releasePointerCapture(e.pointerId);
  };

  private adjustForPixelRatio() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private handleResize = () => {
    const data = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
    this.adjustForPixelRatio();
    this.ctx.putImageData(data, 0, 0);
  };

  saveState() {
    this.undoStack.push(
      this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
    );
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack.length = 0;
    this.onChange?.();
  }

  private restoreState(stack: ImageData[], opposite: ImageData[]) {
    if (!stack.length) return;
    opposite.push(
      this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
    );
    const imageData = stack.pop()!;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(imageData, 0, 0);
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

  get fontFamilyValue() {
    return this.fontFamily?.value || "sans-serif";
  }

  get fontSizeValue() {
    return parseInt(this.fontSize?.value ?? "", 10) || 16;
  }

  private updateCanvasTransform() {
    this.canvas.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.zoom})`;
  }

  zoomBy(factor: number) {
    this.zoom *= factor;
    this.updateCanvasTransform();
  }

  pan(dx: number, dy: number) {
    this.offsetX += dx;
    this.offsetY += dy;
    this.updateCanvasTransform();
  }

  resetView() {
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.updateCanvasTransform();
  }

  private transformEvent(e: PointerEvent): PointerEvent {
    const x = e.offsetX / this.zoom;
    const y = e.offsetY / this.zoom;
    return Object.assign({}, e, {
      offsetX: x,
      offsetY: y,
      buttons: e.buttons,
      button: e.button,
      pointerId: e.pointerId,
    });
  }

  private withContext(fn: () => void) {
    const ctx = this.ctx as CanvasRenderingContext2D &
      Partial<{ save: () => void; restore: () => void }>;
    ctx.save?.();
    (this.ctx as any).setTransform?.(this.dpr, 0, 0, this.dpr, 0, 0);
    (this.ctx as any).translate?.(this.offsetX, this.offsetY);
    (this.ctx as any).scale?.(this.zoom, this.zoom);
    fn();
    ctx.restore?.();
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
  }
}
