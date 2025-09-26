import { Tool } from "../tools/Tool.js";
import type { FloodFillDirtyRect } from "./floodFill.js";
import { floodFill } from "./floodFill.js";

interface FloodFillWorkerRequest {
  id: number;
  type: "fill";
  width: number;
  height: number;
  startX: number;
  startY: number;
  fill: [number, number, number, number];
  maxPixels: number;
  imageBuffer?: ArrayBuffer;
  canvas?: OffscreenCanvas;
}

export interface FloodFillWorkerSuccess {
  id: number;
  type: "result";
  dirtyRects: FloodFillDirtyRect[];
  aborted: boolean;
}

interface FloodFillWorkerError {
  id: number;
  type: "error";
  message: string;
}

type FloodFillWorkerResponse = FloodFillWorkerSuccess | FloodFillWorkerError;

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
  private bucketFillWorker?: Worker;
  private bucketFillWorkerId = 0;
  private bucketFillResolvers = new Map<
    number,
    {
      resolve: (value: FloodFillWorkerSuccess) => void;
      reject: (reason: unknown) => void;
    }
  >();
  private readonly supportsWorker: boolean;

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
    this.supportsWorker = typeof Worker !== "undefined";
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

  supportsBucketFillWorkers() {
    return this.supportsWorker;
  }

  async requestBucketFill(
    request: Omit<FloodFillWorkerRequest, "id">,
    transferables: Transferable[],
  ): Promise<FloodFillWorkerSuccess> {
    const worker = this.ensureBucketFillWorker();
    if (!worker) {
      return this.runBucketFillFallback(request);
    }

    const id = ++this.bucketFillWorkerId;
    const message: FloodFillWorkerRequest = { ...request, id };

    return new Promise<FloodFillWorkerSuccess>((resolve, reject) => {
      this.bucketFillResolvers.set(id, { resolve, reject });
      try {
        worker.postMessage(message, transferables);
      } catch (error) {
        this.bucketFillResolvers.delete(id);
        this.tearDownBucketFillWorker();
        try {
          resolve(this.runBucketFillFallback(request));
        } catch (fallbackError) {
          reject(fallbackError);
        }
      }
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
    this.bucketFillResolvers.forEach(({ reject }) => reject(new Error("Editor destroyed")));
    this.bucketFillResolvers.clear();
    this.tearDownBucketFillWorker();
  }

  private ensureBucketFillWorker(): Worker | null {
    if (!this.supportsWorker) return null;
    if (this.bucketFillWorker) return this.bucketFillWorker;
    try {
      this.bucketFillWorker = new Worker("dist/workers/floodFillWorker.js", {
        type: "module",
      });
      this.bucketFillWorker.addEventListener(
        "message",
        this.handleBucketFillWorkerMessage,
      );
      this.bucketFillWorker.addEventListener(
        "error",
        this.handleBucketFillWorkerError,
      );
      return this.bucketFillWorker;
    } catch (error) {
      console.warn("Failed to initialize bucket fill worker", error);
      this.bucketFillWorker = undefined;
      return null;
    }
  }

  private runBucketFillFallback(
    request: Omit<FloodFillWorkerRequest, "id">,
  ): FloodFillWorkerSuccess {
    if (!request.imageBuffer) {
      throw new Error("Bucket fill fallback requires image buffer");
    }

    const pixels = new Uint8ClampedArray(request.imageBuffer);
    const result = floodFill(pixels, {
      width: request.width,
      height: request.height,
      startX: request.startX,
      startY: request.startY,
      fill: request.fill,
      maxPixels: request.maxPixels,
    });

    return {
      id: 0,
      type: "result",
      dirtyRects: result.dirtyRects,
      aborted: result.aborted,
    };
  }

  private handleBucketFillWorkerMessage = (
    event: MessageEvent<FloodFillWorkerResponse>,
  ) => {
    const message = event.data;
    if (!message) return;

    const pending = this.bucketFillResolvers.get(message.id);
    if (!pending) return;

    this.bucketFillResolvers.delete(message.id);

    if (message.type === "result") {
      pending.resolve(message);
    } else {
      pending.reject(new Error(message.message));
    }
  };

  private handleBucketFillWorkerError = (event: ErrorEvent) => {
    this.bucketFillResolvers.forEach(({ reject }) => reject(event.error));
    this.bucketFillResolvers.clear();
    this.tearDownBucketFillWorker();
  };

  private tearDownBucketFillWorker() {
    if (!this.bucketFillWorker) return;
    this.bucketFillWorker.removeEventListener(
      "message",
      this.handleBucketFillWorkerMessage,
    );
    this.bucketFillWorker.removeEventListener(
      "error",
      this.handleBucketFillWorkerError,
    );
    this.bucketFillWorker.terminate();
    this.bucketFillWorker = undefined;
  }
}
