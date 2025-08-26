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
  fontFamily: HTMLSelectElement | null;
  fontSize: HTMLInputElement | null;
  private onChange?: () => void;

  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  private isSpacePressed = false;
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;

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
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.canvas.addEventListener("wheel", this.handleWheel, {
      passive: false,
    });

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
    // Capture the pointer once before recording canvas state
    this.canvas.setPointerCapture(e.pointerId);
    if (this.isSpacePressed) {
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      return;
    }
    this.saveState();
    this.currentTool?.onPointerDown(e, this);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.isPanning) {
      const dx = e.clientX - this.lastPanX;
      const dy = e.clientY - this.lastPanY;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      this.translateX += dx;
      this.translateY += dy;
      this.updateTransform();
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

  private adjustForPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.updateTransform();
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

  private updateTransform() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(
      this.scale * dpr,
      0,
      0,
      this.scale * dpr,
      this.translateX * dpr,
      this.translateY * dpr,
    );
  }

  getCanvasCoords(e: { offsetX: number; offsetY: number }) {
    return {
      x: (e.offsetX - this.translateX) / this.scale,
      y: (e.offsetY - this.translateY) / this.scale,
    };
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const factor = 1 - e.deltaY * 0.001;
    const wx = (offsetX - this.translateX) / this.scale;
    const wy = (offsetY - this.translateY) / this.scale;
    this.scale *= factor;
    this.translateX = offsetX - wx * this.scale;
    this.translateY = offsetY - wy * this.scale;
    this.updateTransform();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space") this.isSpacePressed = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space") this.isSpacePressed = false;
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

  /**
   * Remove all event listeners registered by the editor.
   * Should be called before discarding the instance to prevent leaks.
   */
  destroy(): void {
    this.currentTool?.destroy?.();
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
  }
}
