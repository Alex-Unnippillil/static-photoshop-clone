import { Tool } from "../tools/Tool.js";

interface Snapshot {
  image: ImageData;
  bytes: number;
}

export interface EditorOptions {
  /** Maximum estimated bytes to retain across undo and redo history. */
  historyMemoryCapBytes?: number;
}

export class Editor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private currentTool: Tool | null = null;
  colorPicker: HTMLInputElement;
  lineWidth: HTMLInputElement;
  fillMode: HTMLInputElement;
  fontFamily: HTMLSelectElement | null;
  fontSize: HTMLInputElement | null;
  private onChange?: () => void;
  private historyByteUsage = 0;
  private historyMemoryCapBytes: number;

  static readonly DEFAULT_HISTORY_MEMORY_CAP_BYTES = 64 * 1024 * 1024;

  constructor(
    canvas: HTMLCanvasElement,
    colorPicker: HTMLInputElement,
    lineWidth: HTMLInputElement,
    fillMode: HTMLInputElement,
    onChange?: () => void,
    fontFamily?: HTMLSelectElement | null,
    fontSize?: HTMLInputElement | null,
    options: EditorOptions = {},
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
    const cap = options.historyMemoryCapBytes;
    if (cap === undefined || Number.isNaN(cap)) {
      this.historyMemoryCapBytes = Editor.DEFAULT_HISTORY_MEMORY_CAP_BYTES;
    } else if (!Number.isFinite(cap)) {
      this.historyMemoryCapBytes = Number.POSITIVE_INFINITY;
    } else {
      this.historyMemoryCapBytes = Math.max(0, cap);
    }
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
    this.clearStack(this.redoStack);
    this.pushSnapshot(
      this.undoStack,
      this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
    );
    this.enforceHistoryCap();
    this.onChange?.();
  }

  private restoreState(stack: Snapshot[], opposite: Snapshot[]) {
    if (!stack.length) return;
    this.pushSnapshot(
      opposite,
      this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height),
    );
    const snapshot = this.popSnapshot(stack);
    if (!snapshot) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.putImageData(snapshot.image, 0, 0);
    this.enforceHistoryCap();
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
  }

  private pushSnapshot(stack: Snapshot[], imageData: ImageData) {
    const snapshot: Snapshot = {
      image: imageData,
      bytes: imageData.width * imageData.height * 4,
    };
    stack.push(snapshot);
    this.historyByteUsage += snapshot.bytes;
  }

  private popSnapshot(stack: Snapshot[]) {
    const snapshot = stack.pop();
    if (snapshot) this.historyByteUsage -= snapshot.bytes;
    return snapshot;
  }

  private shiftSnapshot(stack: Snapshot[]) {
    const snapshot = stack.shift();
    if (snapshot) this.historyByteUsage -= snapshot.bytes;
    return snapshot;
  }

  private clearStack(stack: Snapshot[]) {
    if (!stack.length) return;
    for (const snapshot of stack) {
      this.historyByteUsage -= snapshot.bytes;
    }
    stack.length = 0;
  }

  private enforceHistoryCap() {
    if (this.historyMemoryCapBytes <= 0) {
      if (this.historyByteUsage > 0) {
        this.clearStack(this.undoStack);
        this.clearStack(this.redoStack);
      }
      return;
    }
    if (!Number.isFinite(this.historyMemoryCapBytes)) {
      return;
    }
    while (this.historyByteUsage > this.historyMemoryCapBytes) {
      if (this.undoStack.length) {
        this.shiftSnapshot(this.undoStack);
        continue;
      }
      if (this.redoStack.length) {
        this.shiftSnapshot(this.redoStack);
        continue;
      }
      break;
    }
  }
}
