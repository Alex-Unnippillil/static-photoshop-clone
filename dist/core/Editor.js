export class Editor {
    constructor(canvas, colorPicker, lineWidth, fillMode, onChange, fontFamily, fontSize) {
        this.undoStack = [];
        this.redoStack = [];
        this.currentTool = null;
        this.activeToolPointers = new Set();
        this.capturedPointers = new Set();
        this.pixelRatio = window.devicePixelRatio || 1;
        this.zoom = 1;
        this.minZoom = 0.25;
        this.maxZoom = 8;
        this.panX = 0;
        this.panY = 0;
        this.viewListeners = new Set();
        this.cursorOverride = null;
        this.baseCursor = "crosshair";
        this.spacePressed = false;
        this.panPointerId = null;
        this.lastPanPoint = null;
        this.touchPointers = new Map();
        this.initialPinchDistance = null;
        this.initialPinchZoom = 1;
        this.pinchCenter = null;
        this.isPinching = false;
        this.handlePointerDown = (e) => {
            if (e.pointerType === "touch") {
                this.touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (this.touchPointers.size === 2) {
                    this.beginPinch();
                }
            }
            if (this.isPinching) {
                return;
            }
            if (this.shouldStartPan(e)) {
                this.startPan(e);
                return;
            }
            // Capture the pointer once before recording canvas state
            this.setPointerCaptureSafe(e.pointerId);
            this.saveState();
            this.activeToolPointers.add(e.pointerId);
            this.currentTool?.onPointerDown(e, this);
        };
        this.handlePointerMove = (e) => {
            if (this.panPointerId === e.pointerId && this.lastPanPoint) {
                this.continuePan(e);
                return;
            }
            if (e.pointerType === "touch" && this.touchPointers.has(e.pointerId)) {
                this.touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (this.isPinching) {
                    e.preventDefault();
                    this.updatePinch();
                    return;
                }
            }
            if (!this.activeToolPointers.has(e.pointerId))
                return;
            this.currentTool?.onPointerMove(e, this);
        };
        this.handlePointerUp = (e) => {
            if (this.panPointerId === e.pointerId) {
                this.endPan();
                return;
            }
            const hadToolPointer = this.activeToolPointers.has(e.pointerId);
            if (e.pointerType === "touch") {
                this.touchPointers.delete(e.pointerId);
                if (this.isPinching) {
                    if (hadToolPointer) {
                        this.activeToolPointers.delete(e.pointerId);
                        if (this.hasPointerCaptureSafe(e.pointerId)) {
                            this.releasePointerCaptureSafe(e.pointerId);
                        }
                    }
                    if (this.touchPointers.size < 2) {
                        this.finishPinch();
                    }
                    return;
                }
            }
            if (!hadToolPointer)
                return;
            this.currentTool?.onPointerUp(e, this);
            this.activeToolPointers.delete(e.pointerId);
            if (this.hasPointerCaptureSafe(e.pointerId)) {
                this.releasePointerCaptureSafe(e.pointerId);
            }
        };
        this.handleResize = () => {
            const data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.adjustForPixelRatio();
            this.ctx.putImageData(data, 0, 0);
        };
        this.handleWheel = (e) => {
            if (!(e.ctrlKey || e.metaKey)) {
                return;
            }
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const point = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            const delta = e.deltaY;
            const scale = Math.exp(-delta / 500);
            this.zoomTo(this.zoom * scale, point);
        };
        this.handleKeyDown = (e) => {
            if (e.defaultPrevented)
                return;
            const target = e.target;
            if (target instanceof HTMLElement && this.shouldIgnoreKeyTarget(target)) {
                return;
            }
            if (e.code === "Space") {
                if (!this.spacePressed) {
                    e.preventDefault();
                    this.spacePressed = true;
                    if (!this.cursorOverride) {
                        this.setCursorOverride("grab");
                    }
                }
            }
        };
        this.handleKeyUp = (e) => {
            if (e.code === "Space") {
                this.spacePressed = false;
                if (!this.panPointerId && !this.isPinching) {
                    this.setCursorOverride(null);
                }
            }
        };
        this.preventContextMenu = (e) => {
            e.preventDefault();
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
        this.canvas.style.touchAction = "none";
        this.adjustForPixelRatio();
        window.addEventListener("resize", this.handleResize);
        window.addEventListener("keydown", this.handleKeyDown, { capture: true });
        window.addEventListener("keyup", this.handleKeyUp, { capture: true });
        this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
        this.canvas.addEventListener("pointerdown", this.handlePointerDown);
        this.canvas.addEventListener("pointermove", this.handlePointerMove);
        this.canvas.addEventListener("pointerup", this.handlePointerUp);
        this.canvas.addEventListener("pointercancel", this.handlePointerUp);
        this.canvas.addEventListener("pointerleave", this.handlePointerUp);
        this.canvas.addEventListener("contextmenu", this.preventContextMenu);
        this.emitViewChange();
    }
    setTool(tool) {
        this.currentTool?.destroy?.();
        this.currentTool = tool;
        this.baseCursor = tool.cursor || "crosshair";
        this.updateCursor();
    }
    setPointerCaptureSafe(pointerId) {
        if (typeof this.canvas.setPointerCapture === "function") {
            try {
                this.canvas.setPointerCapture(pointerId);
            }
            catch {
                /* ignore unsupported pointer capture */
            }
        }
        this.capturedPointers.add(pointerId);
    }
    releasePointerCaptureSafe(pointerId) {
        if (typeof this.canvas.releasePointerCapture === "function") {
            try {
                this.canvas.releasePointerCapture(pointerId);
            }
            catch {
                /* ignore unsupported pointer capture */
            }
        }
        this.capturedPointers.delete(pointerId);
    }
    hasPointerCaptureSafe(pointerId) {
        return (typeof this.canvas.hasPointerCapture === "function" &&
            this.canvas.hasPointerCapture(pointerId)) || this.capturedPointers.has(pointerId);
    }
    adjustForPixelRatio() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.pixelRatio = dpr;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.updateTransform();
    }
    shouldIgnoreKeyTarget(target) {
        return (target.closest("input, textarea, select, [contenteditable]") !== null ||
            target.tagName === "BUTTON");
    }
    shouldStartPan(e) {
        if (e.pointerType === "touch") {
            return false;
        }
        return e.button === 1 || (e.button === 0 && this.spacePressed);
    }
    startPan(e) {
        this.panPointerId = e.pointerId;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        this.setPointerCaptureSafe(e.pointerId);
        this.setCursorOverride("grabbing");
    }
    continuePan(e) {
        if (!this.lastPanPoint)
            return;
        const dx = e.clientX - this.lastPanPoint.x;
        const dy = e.clientY - this.lastPanPoint.y;
        this.panX += dx;
        this.panY += dy;
        this.lastPanPoint = { x: e.clientX, y: e.clientY };
        this.updateTransform();
    }
    endPan() {
        if (this.panPointerId !== null && this.hasPointerCaptureSafe(this.panPointerId)) {
            this.releasePointerCaptureSafe(this.panPointerId);
        }
        this.panPointerId = null;
        this.lastPanPoint = null;
        if (this.spacePressed) {
            this.setCursorOverride("grab");
        }
        else {
            this.setCursorOverride(null);
        }
    }
    beginPinch() {
        const pointers = Array.from(this.touchPointers.values());
        if (pointers.length < 2)
            return;
        this.isPinching = true;
        this.initialPinchZoom = this.zoom;
        this.initialPinchDistance = this.distanceBetween(pointers[0], pointers[1]);
        const rect = this.canvas.getBoundingClientRect();
        this.pinchCenter = {
            x: (pointers[0].x + pointers[1].x) / 2 - rect.left,
            y: (pointers[0].y + pointers[1].y) / 2 - rect.top,
        };
        this.activeToolPointers.forEach((pointerId) => {
            if (this.hasPointerCaptureSafe(pointerId)) {
                this.releasePointerCaptureSafe(pointerId);
            }
        });
        this.activeToolPointers.clear();
        this.setCursorOverride("grabbing");
    }
    updatePinch() {
        const pointers = Array.from(this.touchPointers.values());
        if (pointers.length < 2 || !this.initialPinchDistance) {
            return;
        }
        const rect = this.canvas.getBoundingClientRect();
        const center = {
            x: (pointers[0].x + pointers[1].x) / 2 - rect.left,
            y: (pointers[0].y + pointers[1].y) / 2 - rect.top,
        };
        if (this.pinchCenter) {
            this.panX += center.x - this.pinchCenter.x;
            this.panY += center.y - this.pinchCenter.y;
        }
        this.pinchCenter = center;
        const distance = this.distanceBetween(pointers[0], pointers[1]);
        const scale = distance / this.initialPinchDistance;
        this.zoomTo(this.initialPinchZoom * scale, center);
    }
    finishPinch() {
        this.isPinching = false;
        this.initialPinchDistance = null;
        this.initialPinchZoom = this.zoom;
        this.pinchCenter = null;
        if (this.spacePressed) {
            this.setCursorOverride("grab");
        }
        else {
            this.setCursorOverride(null);
        }
    }
    distanceBetween(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }
    updateCursor() {
        this.canvas.style.cursor = this.cursorOverride ?? this.baseCursor;
    }
    setCursorOverride(cursor) {
        this.cursorOverride = cursor;
        this.updateCursor();
    }
    zoomTo(zoom, center) {
        const clamped = Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
        if (center) {
            const worldX = (center.x - this.panX) / this.zoom;
            const worldY = (center.y - this.panY) / this.zoom;
            this.zoom = clamped;
            this.panX = center.x - worldX * this.zoom;
            this.panY = center.y - worldY * this.zoom;
        }
        else {
            this.zoom = clamped;
        }
        this.updateTransform();
    }
    updateTransform(options = {}) {
        this.ctx.setTransform(this.pixelRatio * this.zoom, 0, 0, this.pixelRatio * this.zoom, this.panX * this.pixelRatio, this.panY * this.pixelRatio);
        if (!options.suppress) {
            this.emitViewChange();
        }
    }
    emitViewChange() {
        const state = this.getViewState();
        this.viewListeners.forEach((listener) => listener(state));
    }
    clampZoom(value) {
        return Math.min(this.maxZoom, Math.max(this.minZoom, value));
    }
    getViewState() {
        return { zoom: this.zoom, panX: this.panX, panY: this.panY };
    }
    onViewChange(listener) {
        this.viewListeners.add(listener);
        listener(this.getViewState());
        return () => {
            this.viewListeners.delete(listener);
        };
    }
    setViewState(state) {
        this.zoom = this.clampZoom(state.zoom);
        this.panX = state.panX;
        this.panY = state.panY;
        this.updateTransform();
    }
    syncViewState(state) {
        this.zoom = this.clampZoom(state.zoom);
        this.panX = state.panX;
        this.panY = state.panY;
        this.updateTransform({ suppress: true });
    }
    zoomIn(center) {
        this.zoomTo(this.zoom * 1.25, center);
    }
    zoomOut(center) {
        this.zoomTo(this.zoom / 1.25, center);
    }
    resetView() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateTransform();
    }
    get zoomFactor() {
        return this.zoom;
    }
    get pixelRatioValue() {
        return this.pixelRatio;
    }
    get lineWidthOnCanvas() {
        return this.lineWidthValue / this.zoom;
    }
    getCanvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const fallback = e;
        const hasOffsetX = typeof fallback.offsetX === "number" && !Number.isNaN(fallback.offsetX);
        const hasOffsetY = typeof fallback.offsetY === "number" && !Number.isNaN(fallback.offsetY);
        const hasClientX = typeof e.clientX === "number" && !Number.isNaN(e.clientX);
        const hasClientY = typeof e.clientY === "number" && !Number.isNaN(e.clientY);
        const cssX = hasOffsetX
            ? fallback.offsetX
            : hasClientX
                ? e.clientX - rect.left
                : 0;
        const cssY = hasOffsetY
            ? fallback.offsetY
            : hasClientY
                ? e.clientY - rect.top
                : 0;
        return {
            x: (cssX - this.panX) / this.zoom,
            y: (cssY - this.panY) / this.zoom,
        };
    }
    canvasToScreen(x, y) {
        return {
            x: x * this.zoom + this.panX,
            y: y * this.zoom + this.panY,
        };
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
    /**
     * Remove all event listeners registered by the editor.
     * Should be called before discarding the instance to prevent leaks.
     */
    destroy() {
        this.currentTool?.destroy?.();
        window.removeEventListener("resize", this.handleResize);
        window.removeEventListener("keydown", this.handleKeyDown, true);
        window.removeEventListener("keyup", this.handleKeyUp, true);
        this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
        this.canvas.removeEventListener("pointermove", this.handlePointerMove);
        this.canvas.removeEventListener("pointerup", this.handlePointerUp);
        this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
        this.canvas.removeEventListener("pointerleave", this.handlePointerUp);
        this.canvas.removeEventListener("wheel", this.handleWheel);
        this.canvas.removeEventListener("contextmenu", this.preventContextMenu);
        this.viewListeners.clear();
    }
}
