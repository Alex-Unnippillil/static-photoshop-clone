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
  fontWeight: HTMLSelectElement | null;
  fontStyleControl: HTMLSelectElement | null;
  textAlignControl: HTMLSelectElement | null;
  textMultilineToggle: HTMLInputElement | null;
  private onChange?: () => void;

  constructor(
    canvas: HTMLCanvasElement,
    colorPicker: HTMLInputElement,
    lineWidth: HTMLInputElement,
    fillMode: HTMLInputElement,
    onChange?: () => void,
    fontFamily?: HTMLSelectElement | null,
    fontSize?: HTMLInputElement | null,
    fontWeight?: HTMLSelectElement | null,
    fontStyleControl?: HTMLSelectElement | null,
    textAlignControl?: HTMLSelectElement | null,
    textMultilineToggle?: HTMLInputElement | null,
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
    this.fontWeight = fontWeight ?? null;
    this.fontStyleControl = fontStyleControl ?? null;
    this.textAlignControl = textAlignControl ?? null;
    this.textMultilineToggle = textMultilineToggle ?? null;
    this.adjustForPixelRatio();
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
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Reset any existing transforms
    this.ctx.scale(1, 1);
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

  get fontWeightValue() {
    return this.fontWeight?.value || "normal";
  }

  get fontStyleValue() {
    return this.fontStyleControl?.value || "normal";
  }

  get textAlignValue(): CanvasTextAlign {
    const value = this.textAlignControl?.value || "left";
    if (value === "center" || value === "right" || value === "left") {
      return value;
    }
    return "left";
  }

  get textMultiline() {
    return Boolean(this.textMultilineToggle?.checked ?? true);
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
