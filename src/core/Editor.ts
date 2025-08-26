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
  private offsetX = 0;
  private offsetY = 0;
  private isPanning = false;
  private panLastX = 0;
  private panLastY = 0;
  private spacePressed = false;
  private dpr = 1;

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
    // Capture the pointer once before recording canvas state
    this.canvas.setPointerCapture(e.pointerId);
    if (this.spacePressed) {
      this.isPanning = true;
      this.panLastX = e.clientX;
      this.panLastY = e.clientY;
      return;
    }
    this.saveState();
    this.currentTool?.onPointerDown(e, this);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.isPanning) {
      const dx = e.clientX - this.panLastX;
      const dy = e.clientY - this.panLastY;
      this.panLastX = e.clientX;
      this.panLastY = e.clientY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.applyViewportTransform();
      return;
    }
    this.currentTool?.onPointerMove(e, this);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.isPanning) {
      this.isPanning = false;
    } else {
      this.currentTool?.onPointerUp(e, this);
    }
    this.canvas.releasePointerCapture(e.pointerId);
  };

  private adjustForPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.applyViewportTransform();
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

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const wx = (x - this.offsetX) / this.scale;
    const wy = (y - this.offsetY) / this.scale;
    this.scale *= scaleFactor;
    this.offsetX = x - wx * this.scale;
    this.offsetY = y - wy * this.scale;
    this.applyViewportTransform();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" && !this.spacePressed) {
      this.spacePressed = true;
      this.canvas.style.cursor = "grab";
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      this.spacePressed = false;
      this.isPanning = false;
      this.canvas.style.cursor = this.currentTool?.cursor || "crosshair";
    }
  };

  private applyViewportTransform() {
    this.ctx.setTransform(
      this.dpr * this.scale,
      0,
      0,
      this.dpr * this.scale,
      this.offsetX * this.dpr,
      this.offsetY * this.dpr,
    );
  }

  toCanvasCoords(e: { offsetX: number; offsetY: number }): {
    x: number;
    y: number;
  } {
    return {
      x: (e.offsetX - this.offsetX) / this.scale,
      y: (e.offsetY - this.offsetY) / this.scale,
    };
  }

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
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(imageData, 0, 0);
    this.ctx.restore();
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
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }
}
