import { Tool } from "../tools/Tool.js";

export class Editor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  readonly previewCanvas: HTMLCanvasElement;
  readonly previewCtx: CanvasRenderingContext2D;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private currentTool: Tool | null = null;
  colorPicker: HTMLInputElement;
  lineWidth: HTMLInputElement;
  fillMode: HTMLInputElement;
  fontFamily: HTMLSelectElement | null;
  fontSize: HTMLInputElement | null;
  private previewToggle: HTMLInputElement | null;
  private onChange?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    colorPicker: HTMLInputElement,
    lineWidth: HTMLInputElement,
    fillMode: HTMLInputElement,
    onChange?: () => void,
    fontFamily?: HTMLSelectElement | null,
    fontSize?: HTMLInputElement | null,
    previewToggle?: HTMLInputElement | null,
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
    this.previewToggle = previewToggle ?? null;

    this.previewCanvas = this.createPreviewCanvas();
    const previewCtx = this.previewCanvas.getContext("2d");
    if (!previewCtx) {
      throw new Error("Unable to get preview 2D context");
    }
    this.previewCtx = previewCtx;
    this.adjustForPixelRatio();
    window.addEventListener("resize", this.handleResize);

    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("pointerleave", this.handlePointerLeave);
    this.canvas.addEventListener("pointercancel", this.handlePointerLeave);
  }

  setTool(tool: Tool) {
    this.currentTool?.destroy?.();
    this.currentTool = tool;
    this.canvas.style.cursor = tool.cursor || "crosshair";
  }

  private createPreviewCanvas(): HTMLCanvasElement {
    const overlay = document.createElement("canvas");
    overlay.classList.add("preview-overlay");
    overlay.style.pointerEvents = "none";
    overlay.width = this.canvas.width;
    overlay.height = this.canvas.height;
    const parent = this.canvas.parentElement;
    if (parent) {
      parent.appendChild(overlay);
    }
    return overlay;
  }

  private handlePointerDown = (e: PointerEvent) => {
    // Capture the pointer once before recording canvas state
    this.canvas.setPointerCapture(e.pointerId);
    this.saveState();
    this.currentTool?.onPointerDown(e, this);
  };

  private handlePointerMove = (e: PointerEvent) => {
    this.currentTool?.onPointerMove(e, this);
  };

  private handlePointerUp = (e: PointerEvent) => {
    this.currentTool?.onPointerUp(e, this);
    this.canvas.releasePointerCapture(e.pointerId);
  };

  private handlePointerLeave = () => {
    this.clearPreview();
  };

  private adjustForPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Reset any existing transforms
    this.ctx.scale(1, 1);
    this.previewCanvas.width = rect.width * dpr;
    this.previewCanvas.height = rect.height * dpr;
    this.previewCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.previewCtx.scale(1, 1);
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

  get previewEnabled() {
    return this.previewToggle ? this.previewToggle.checked : true;
  }

  clearPreview() {
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
  }

  withPreviewContext(
    callback: (ctx: CanvasRenderingContext2D) => void,
    { clear = true }: { clear?: boolean } = {},
  ) {
    if (!this.previewEnabled) {
      if (clear) {
        this.clearPreview();
      }
      return;
    }
    if (clear) {
      this.clearPreview();
    }
    this.previewCtx.save();
    try {
      callback(this.previewCtx);
    } finally {
      this.previewCtx.restore();
    }
  }

  showBrushPreview(
    x: number,
    y: number,
    options: {
      size?: number;
      color?: string;
      lineDash?: number[];
    } = {},
  ) {
    const size = options.size ?? this.lineWidthValue;
    this.withPreviewContext((ctx) => {
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 1;
      ctx.strokeStyle = options.color ?? this.strokeStyle;
      if (options.lineDash) {
        ctx.setLineDash(options.lineDash);
      }
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    });
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
    this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
    this.canvas.removeEventListener("pointercancel", this.handlePointerLeave);
    this.previewCanvas.remove();
  }
}
