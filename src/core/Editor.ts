import { Tool } from "../tools/Tool.js";

export interface SnapIndicator {
  point?: { x: number; y: number };
  origin?: { x: number; y: number };
  lines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

export interface SnapPointResult {
  x: number;
  y: number;
  snapped: boolean;
}

export interface AxisSnapResult {
  x: number;
  y: number;
  vertical: boolean;
  horizontal: boolean;
}

export interface AngleSnapResult {
  x: number;
  y: number;
  angle: number | null;
  snapped: boolean;
}

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
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private displayWidth = 0;
  private displayHeight = 0;
  private snapGridEnabled = false;
  private snapGuideEnabled = false;
  private snapAngleEnabled = false;
  private readonly snapGridSize = 10;
  private readonly guideSnapThreshold = 8;

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
    this.createOverlay();
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

  private adjustForPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Reset any existing transforms
    this.ctx.scale(1, 1);
    this.syncOverlaySize();
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

  private createOverlay() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const element = document.createElement("canvas");
    if (!(element instanceof HTMLCanvasElement)) {
      return;
    }
    const overlay = element;
    overlay.className = "snapping-guides";
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.pointerEvents = "none";
    if (overlay.getContext === HTMLCanvasElement.prototype.getContext) {
      return;
    }
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = overlay.getContext("2d");
    } catch {
      return;
    }
    if (!ctx) {
      return;
    }
    parent.appendChild(overlay);
    this.overlayCanvas = overlay;
    this.overlayCtx = ctx;
    this.syncOverlaySize();
  }

  private syncOverlaySize() {
    if (!this.overlayCanvas || !this.overlayCtx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = this.displayWidth || this.canvas.width / dpr;
    const height = this.displayHeight || this.canvas.height / dpr;
    this.overlayCanvas.width = width * dpr;
    this.overlayCanvas.height = height * dpr;
    this.overlayCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.overlayCtx.clearRect(0, 0, width, height);
  }

  clearSnapGuides(): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const width = this.displayWidth || this.canvas.width / dpr;
    const height = this.displayHeight || this.canvas.height / dpr;
    this.overlayCtx.clearRect(0, 0, width, height);
  }

  showSnapGuides(indicator: SnapIndicator | null): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;
    const ctx = this.overlayCtx;
    this.clearSnapGuides();
    if (!indicator) {
      return;
    }
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(30, 144, 255, 0.85)";
    ctx.fillStyle = "rgba(30, 144, 255, 0.35)";
    ctx.setLineDash([6, 6]);
    indicator.lines?.forEach(({ x1, y1, x2, y2 }) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    if (indicator.origin) {
      ctx.beginPath();
      ctx.arc(indicator.origin.x, indicator.origin.y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (indicator.point) {
      ctx.beginPath();
      ctx.arc(indicator.point.x, indicator.point.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  setSnapping({
    grid,
    guides,
    angle,
  }: {
    grid?: boolean;
    guides?: boolean;
    angle?: boolean;
  }): void {
    if (typeof grid === "boolean") this.snapGridEnabled = grid;
    if (typeof guides === "boolean") this.snapGuideEnabled = guides;
    if (typeof angle === "boolean") this.snapAngleEnabled = angle;
  }

  get isGridSnappingEnabled(): boolean {
    return this.snapGridEnabled;
  }

  get isGuideSnappingEnabled(): boolean {
    return this.snapGuideEnabled;
  }

  get isAngleSnappingEnabled(): boolean {
    return this.snapAngleEnabled;
  }

  get gridSnapSize(): number {
    return this.snapGridSize;
  }

  snapPoint(x: number, y: number): SnapPointResult {
    if (!this.snapGridEnabled) {
      return { x, y, snapped: false };
    }
    const snappedX = Math.round(x / this.snapGridSize) * this.snapGridSize;
    const snappedY = Math.round(y / this.snapGridSize) * this.snapGridSize;
    const snapped = snappedX !== x || snappedY !== y;
    return { x: snappedX, y: snappedY, snapped };
  }

  snapToGuides(
    origin: { x: number; y: number },
    point: { x: number; y: number },
  ): AxisSnapResult {
    if (!this.snapGuideEnabled) {
      return { ...point, vertical: false, horizontal: false };
    }
    let { x, y } = point;
    let vertical = false;
    let horizontal = false;
    if (Math.abs(point.x - origin.x) <= this.guideSnapThreshold) {
      x = origin.x;
      vertical = true;
    }
    if (Math.abs(point.y - origin.y) <= this.guideSnapThreshold) {
      y = origin.y;
      horizontal = true;
    }
    return { x, y, vertical, horizontal };
  }

  snapAngle(
    origin: { x: number; y: number },
    point: { x: number; y: number },
    force = false,
  ): AngleSnapResult {
    if (!force && !this.snapAngleEnabled) {
      return { ...point, angle: null, snapped: false };
    }
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    if (dx === 0 && dy === 0) {
      return { ...point, angle: null, snapped: false };
    }
    const angle = Math.atan2(dy, dx);
    const increment = Math.PI / 4;
    const snappedAngle = Math.round(angle / increment) * increment;
    const length = Math.sqrt(dx * dx + dy * dy);
    const x = origin.x + length * Math.cos(snappedAngle);
    const y = origin.y + length * Math.sin(snappedAngle);
    return { x, y, angle: snappedAngle, snapped: true };
  }

  shouldSnapAngles(e: Pick<PointerEvent, "shiftKey">): boolean {
    return e.shiftKey || this.snapAngleEnabled;
  }

  get guideThreshold(): number {
    return this.guideSnapThreshold;
  }

  get viewportWidth(): number {
    const dpr = window.devicePixelRatio || 1;
    return this.displayWidth || this.canvas.width / dpr;
  }

  get viewportHeight(): number {
    const dpr = window.devicePixelRatio || 1;
    return this.displayHeight || this.canvas.height / dpr;
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
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.overlayCanvas?.remove();
    this.overlayCanvas = null;
    this.overlayCtx = null;
  }
}
