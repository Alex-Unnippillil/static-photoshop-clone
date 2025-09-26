import { Tool } from "../tools/Tool.js";

type CanvasRect = { x: number; y: number; width: number; height: number };

type CanvasHistoryEntry =
  | {
      type: "snapshot";
      before: ImageData;
      after: ImageData;
    }
  | {
      type: "diff";
      rect: CanvasRect;
      before: ImageData;
      after: ImageData;
    };

type PendingCapture = {
  before: ImageData;
  useDiff: boolean;
  diff?: {
    rect: CanvasRect;
    before: ImageData;
    after: ImageData;
  };
};

export class Editor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private undoStack: CanvasHistoryEntry[] = [];
  private redoStack: CanvasHistoryEntry[] = [];
  private pendingCapture: PendingCapture | null = null;
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
    this.commitPendingState();
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
    const before = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const useDiff =
      this.canvas.width * this.canvas.height >
      Editor.DIFF_CANVAS_AREA_THRESHOLD;
    this.pendingCapture = { before, useDiff };
    this.redoStack.length = 0;
  }

  recordDiff(rect: CanvasRect) {
    if (!this.pendingCapture || !this.pendingCapture.useDiff) return;
    const normalized = this.normalizeRect(rect);
    if (!normalized) return;
    const beforeRegion = this.extractRegion(this.pendingCapture.before, normalized);
    const afterRegion = this.ctx.getImageData(
      normalized.x,
      normalized.y,
      normalized.width,
      normalized.height,
    );
    this.pendingCapture.diff = {
      rect: normalized,
      before: beforeRegion,
      after: afterRegion,
    };
  }

  private commitPendingState() {
    if (!this.pendingCapture) return;
    const { diff, before, useDiff } = this.pendingCapture;
    let entry: CanvasHistoryEntry;
    if (useDiff && diff) {
      entry = {
        type: "diff",
        rect: diff.rect,
        before: diff.before,
        after: diff.after,
      };
    } else {
      const after = this.ctx.getImageData(
        0,
        0,
        this.canvas.width,
        this.canvas.height,
      );
      entry = {
        type: "snapshot",
        before,
        after,
      };
    }

    this.undoStack.push(entry);
    if (this.undoStack.length > Editor.MAX_HISTORY) {
      this.undoStack.shift();
    }
    this.pendingCapture = null;
    this.onChange?.();
  }

  private restoreState(
    stack: CanvasHistoryEntry[],
    opposite: CanvasHistoryEntry[],
    direction: "undo" | "redo",
  ) {
    if (!stack.length) return;
    const entry = stack.pop()!;
    opposite.push(entry);
    if (opposite.length > Editor.MAX_HISTORY) {
      opposite.shift();
    }
    this.applyHistoryEntry(entry, direction);
    this.onChange?.();
  }

  private applyHistoryEntry(
    entry: CanvasHistoryEntry,
    direction: "undo" | "redo",
  ) {
    const imageData = direction === "undo" ? entry.before : entry.after;
    if (entry.type === "diff") {
      this.ctx.putImageData(imageData, entry.rect.x, entry.rect.y);
    } else {
      this.ctx.putImageData(imageData, 0, 0);
    }
  }

  undo() {
    this.restoreState(this.undoStack, this.redoStack, "undo");
  }

  redo() {
    this.restoreState(this.redoStack, this.undoStack, "redo");
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

  private normalizeRect(rect: CanvasRect): CanvasRect | null {
    const scale = window.devicePixelRatio || 1;
    const scaledX = Math.floor(rect.x * scale);
    const scaledY = Math.floor(rect.y * scale);
    const scaledRight = Math.ceil((rect.x + rect.width) * scale);
    const scaledBottom = Math.ceil((rect.y + rect.height) * scale);
    const x = Math.max(0, Math.min(this.canvas.width, scaledX));
    const y = Math.max(0, Math.min(this.canvas.height, scaledY));
    const right = Math.max(x, Math.min(this.canvas.width, scaledRight));
    const bottom = Math.max(y, Math.min(this.canvas.height, scaledBottom));
    const width = right - x;
    const height = bottom - y;
    if (width <= 0 || height <= 0) {
      return null;
    }
    return { x, y, width, height };
  }

  private extractRegion(source: ImageData, rect: CanvasRect): ImageData {
    const region = new ImageData(rect.width, rect.height);
    const bytesPerPixel = 4;
    for (let row = 0; row < rect.height; row++) {
      const srcStart =
        ((rect.y + row) * source.width + rect.x) * bytesPerPixel;
      const destStart = row * rect.width * bytesPerPixel;
      region.data.set(
        source.data.subarray(srcStart, srcStart + rect.width * bytesPerPixel),
        destStart,
      );
    }
    return region;
  }

  private static readonly MAX_HISTORY = 50;
  private static readonly DIFF_CANVAS_AREA_THRESHOLD = 512 * 512;
}
