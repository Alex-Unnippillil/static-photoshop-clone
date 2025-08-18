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
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private touches = new Map<number, PointerEvent>();
  private pinchStartDist = 0;
  private pinchStartScale = 1;
  private lastCenter: { x: number; y: number } | null = null;

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
    this.canvas.addEventListener("pointercancel", this.handlePointerUp);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  setTool(tool: Tool) {
    this.currentTool?.destroy?.();
    this.currentTool = tool;
    this.canvas.style.cursor = tool.cursor || "crosshair";
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      this.touches.set(e.pointerId, e);
      if (this.touches.size === 2) {
        const [p1, p2] = Array.from(this.touches.values());
        this.pinchStartDist = this.distance(p1, p2);
        this.pinchStartScale = this.scale;
        this.lastCenter = this.center(p1, p2);
        return;
      }
    }
    // Capture the pointer once before recording canvas state
    this.canvas.setPointerCapture(e.pointerId);
    this.saveState();
    this.currentTool?.onPointerDown(e, this);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" && this.touches.size >= 2) {
      this.touches.set(e.pointerId, e);
      const [p1, p2] = Array.from(this.touches.values());
      const newDist = this.distance(p1, p2);
      const newCenter = this.center(p1, p2);
      this.scale = this.pinchStartScale * (newDist / this.pinchStartDist || 1);
      if (this.lastCenter) {
        this.offsetX += newCenter.x - this.lastCenter.x;
        this.offsetY += newCenter.y - this.lastCenter.y;
      }
      this.lastCenter = newCenter;
      this.updateTransform();
      return;
    }
    this.currentTool?.onPointerMove(e, this);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      this.touches.delete(e.pointerId);
      if (this.touches.size >= 1) {
        return;
      }
      this.lastCenter = null;
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

  private updateTransform() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(
      this.scale * dpr,
      0,
      0,
      this.scale * dpr,
      this.offsetX * dpr,
      this.offsetY * dpr,
    );
  }

  getTransformedPoint(e: PointerEvent) {
    return {
      x: (e.offsetX - this.offsetX) / this.scale,
      y: (e.offsetY - this.offsetY) / this.scale,
    };
  }

  private distance(a: PointerEvent, b: PointerEvent) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  private center(a: PointerEvent, b: PointerEvent) {
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  }

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const { offsetX, offsetY, deltaY } = e;
      const factor = deltaY < 0 ? 1.1 : 0.9;
      const x = (offsetX - this.offsetX) / this.scale;
      const y = (offsetY - this.offsetY) / this.scale;
      this.scale *= factor;
      this.offsetX -= x * (factor - 1);
      this.offsetY -= y * (factor - 1);
    } else {
      this.offsetX -= e.deltaX;
      this.offsetY -= e.deltaY;
    }
    this.updateTransform();
  };

  saveState() {
    if (typeof this.ctx.getImageData !== "function") return;
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
    this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
  }
}
