export class Editor {
    constructor(canvas, colorPicker, lineWidth, fillMode, brushSpacing, brushHardness, brushShape, onChange, fontFamily, fontSize) {
        this.undoStack = [];
        this.redoStack = [];
        this.currentTool = null;
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
        this.handlePointerLeave = () => {
            this.clearBrushPreview();
        };
        this.handleResize = () => {
            const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.adjustForPixelRatio();
            this.ctx.putImageData(data, 0, 0);
        };
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Unable to get 2D context");
        this.ctx = ctx;
        this.colorPicker = colorPicker;
        this.lineWidth = lineWidth;
        this.fillMode = fillMode;
        this.brushSpacing = brushSpacing ?? this.createFallbackRange("25", "5", "200");
        this.brushHardness = brushHardness ?? this.createFallbackRange("100", "0", "100");
        this.brushShape = brushShape ?? this.createFallbackShape();
        this.onChange = onChange;
        this.fontFamily = fontFamily ?? null;
        this.fontSize = fontSize ?? null;
        this.adjustForPixelRatio();
        window.addEventListener("resize", this.handleResize);
        const previewCandidate = document.createElement("canvas");
        if (previewCandidate instanceof HTMLCanvasElement) {
            this.brushPreviewCanvas = previewCandidate;
        }
        else {
            this.brushPreviewCanvas = this.createPassiveCanvas();
        }
        if (!this.brushPreviewCanvas.style) {
            this.brushPreviewCanvas.style = {};
        }
        this.brushPreviewCanvas.className = "brush-preview";
        this.brushPreviewCanvas.width = 0;
        this.brushPreviewCanvas.height = 0;
        this.brushPreviewCtx = null;
        const parent = this.canvas.parentElement;
        if (parent &&
            typeof parent.appendChild === "function" &&
            this.brushPreviewCanvas.nodeType === 1) {
            parent.appendChild(this.brushPreviewCanvas);
        }
        this.clearBrushPreview();
        this.canvas.addEventListener("pointerdown", this.handlePointerDown);
        this.canvas.addEventListener("pointermove", this.handlePointerMove);
        this.canvas.addEventListener("pointerup", this.handlePointerUp);
        this.canvas.addEventListener("pointerleave", this.handlePointerLeave);
    }
    setTool(tool) {
        this.currentTool?.destroy?.();
        this.currentTool = tool;
        this.canvas.style.cursor = tool.cursor || "crosshair";
        this.clearBrushPreview();
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
    get brushSpacingValue() {
        return parseFloat(this.brushSpacing.value) || 25;
    }
    get brushSpacingPx() {
        return Math.max(0, (this.brushSpacingValue / 100) * this.lineWidthValue);
    }
    get brushHardnessValue() {
        const raw = parseFloat(this.brushHardness.value);
        const normalized = isNaN(raw) ? 100 : raw;
        return Math.min(1, Math.max(0, normalized / 100));
    }
    get brushTipShape() {
        const value = this.brushShape.value;
        return value === "square" ? "square" : "round";
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
    renderBrushPreview(stamp, x, y) {
        const previewCtx = this.ensureBrushPreviewContext();
        if (!previewCtx)
            return;
        const width = stamp.width;
        const height = stamp.height;
        this.brushPreviewCanvas.width = width;
        this.brushPreviewCanvas.height = height;
        this.brushPreviewCanvas.style.width = `${width}px`;
        this.brushPreviewCanvas.style.height = `${height}px`;
        previewCtx.clearRect(0, 0, width, height);
        previewCtx.drawImage(stamp, 0, 0);
        if (this.brushPreviewCanvas.style) {
            this.brushPreviewCanvas.style.display = "block";
            this.brushPreviewCanvas.style.left = `${x}px`;
            this.brushPreviewCanvas.style.top = `${y}px`;
            this.brushPreviewCanvas.style.transform = "translate(-50%, -50%)";
        }
    }
    clearBrushPreview() {
        if (this.brushPreviewCanvas.style) {
            this.brushPreviewCanvas.style.display = "none";
        }
    }
    handleBrushSettingsChange() {
        this.currentTool?.onBrushSettingsChange?.(this);
    }
    createFallbackRange(value, min, max) {
        const input = document.createElement("input");
        input.type = "range";
        input.value = value;
        input.min = min;
        input.max = max;
        if (typeof input.addEventListener !== "function") {
            const passive = {
                type: "range",
                value,
                min,
                max,
                addEventListener: () => { },
                removeEventListener: () => { },
            };
            return passive;
        }
        return input;
    }
    createFallbackShape() {
        const select = document.createElement("select");
        const option = document.createElement("option");
        option.value = "round";
        option.textContent = "Round";
        if (typeof select.appendChild === "function") {
            select.appendChild(option);
            return select;
        }
        const passive = {
            value: "round",
            options: [],
            addEventListener: () => { },
            removeEventListener: () => { },
        };
        return passive;
    }
    createPassiveCanvas() {
        const fallback = {
            width: 0,
            height: 0,
            style: {},
            addEventListener: () => { },
            removeEventListener: () => { },
            getContext: () => null,
            remove: () => { },
        };
        return fallback;
    }
    ensureBrushPreviewContext() {
        const globalWindow = typeof window === "undefined" ? undefined : window;
        if (globalWindow && typeof globalWindow.CanvasRenderingContext2D === "undefined") {
            return null;
        }
        if (this.brushPreviewCtx) {
            return this.brushPreviewCtx;
        }
        try {
            if (typeof this.brushPreviewCanvas.getContext === "function") {
                this.brushPreviewCtx = this.brushPreviewCanvas.getContext("2d");
            }
            else {
                this.brushPreviewCtx = null;
            }
        }
        catch {
            this.brushPreviewCtx = null;
        }
        return this.brushPreviewCtx;
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
        this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
        if (typeof this.brushPreviewCanvas.remove === "function") {
            this.brushPreviewCanvas.remove();
        }
    }
}
