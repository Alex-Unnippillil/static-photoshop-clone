import { floodFill } from "./floodFill.js";
export class Editor {
    constructor(canvas, colorPicker, lineWidth, fillMode, onChange, fontFamily, fontSize) {
        this.undoStack = [];
        this.redoStack = [];
        this.currentTool = null;
        this.bucketFillWorkerId = 0;
        this.bucketFillResolvers = new Map();
        this.handlePointerDown = (e) => {
            // Capture the pointer once before recording canvas state
            this.canvas.setPointerCapture(e.pointerId);
            this.saveState();
            this.currentTool?.onPointerDown(e, this);
        };
        this.handlePointerMove = (e) => {
            this.currentTool?.onPointerMove(e, this);
        };
        this.handlePointerUp = (e) => {
            this.currentTool?.onPointerUp(e, this);
            this.canvas.releasePointerCapture(e.pointerId);
        };
        this.handleResize = () => {
            const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.adjustForPixelRatio();
            this.ctx.putImageData(data, 0, 0);
        };
        this.handleBucketFillWorkerMessage = (event) => {
            const message = event.data;
            if (!message)
                return;
            const pending = this.bucketFillResolvers.get(message.id);
            if (!pending)
                return;
            this.bucketFillResolvers.delete(message.id);
            if (message.type === "result") {
                pending.resolve(message);
            }
            else {
                pending.reject(new Error(message.message));
            }
        };
        this.handleBucketFillWorkerError = (event) => {
            this.bucketFillResolvers.forEach(({ reject }) => reject(event.error));
            this.bucketFillResolvers.clear();
            this.tearDownBucketFillWorker();
        };
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Unable to get 2D context");
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
    setTool(tool) {
        this.currentTool?.destroy?.();
        this.currentTool = tool;
        this.canvas.style.cursor = tool.cursor || "crosshair";
    }
    adjustForPixelRatio() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Reset any existing transforms
        this.ctx.scale(1, 1);
    }
    saveState() {
        this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        if (this.undoStack.length > 50)
            this.undoStack.shift();
        this.redoStack.length = 0;
        this.onChange?.();
    }
    restoreState(stack, opposite) {
        if (!stack.length)
            return;
        opposite.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        const imageData = stack.pop();
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
    async requestBucketFill(request, transferables) {
        const worker = this.ensureBucketFillWorker();
        if (!worker) {
            return this.runBucketFillFallback(request);
        }
        const id = ++this.bucketFillWorkerId;
        const message = { ...request, id };
        return new Promise((resolve, reject) => {
            this.bucketFillResolvers.set(id, { resolve, reject });
            try {
                worker.postMessage(message, transferables);
            }
            catch (error) {
                this.bucketFillResolvers.delete(id);
                this.tearDownBucketFillWorker();
                try {
                    resolve(this.runBucketFillFallback(request));
                }
                catch (fallbackError) {
                    reject(fallbackError);
                }
            }
        });
    }
    /**
     * Remove all event listeners registered by the editor.
     * Should be called before discarding the instance to prevent leaks.
     */
    destroy() {
        this.currentTool?.destroy?.();
        window.removeEventListener("resize", this.handleResize);
        this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
        this.canvas.removeEventListener("pointermove", this.handlePointerMove);
        this.canvas.removeEventListener("pointerup", this.handlePointerUp);
        this.bucketFillResolvers.forEach(({ reject }) => reject(new Error("Editor destroyed")));
        this.bucketFillResolvers.clear();
        this.tearDownBucketFillWorker();
    }
    ensureBucketFillWorker() {
        if (!this.supportsWorker)
            return null;
        if (this.bucketFillWorker)
            return this.bucketFillWorker;
        try {
            this.bucketFillWorker = new Worker("dist/workers/floodFillWorker.js", {
                type: "module",
            });
            this.bucketFillWorker.addEventListener("message", this.handleBucketFillWorkerMessage);
            this.bucketFillWorker.addEventListener("error", this.handleBucketFillWorkerError);
            return this.bucketFillWorker;
        }
        catch (error) {
            console.warn("Failed to initialize bucket fill worker", error);
            this.bucketFillWorker = undefined;
            return null;
        }
    }
    runBucketFillFallback(request) {
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
    tearDownBucketFillWorker() {
        if (!this.bucketFillWorker)
            return;
        this.bucketFillWorker.removeEventListener("message", this.handleBucketFillWorkerMessage);
        this.bucketFillWorker.removeEventListener("error", this.handleBucketFillWorkerError);
        this.bucketFillWorker.terminate();
        this.bucketFillWorker = undefined;
    }
}
