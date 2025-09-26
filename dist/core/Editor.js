export class Editor {
    constructor(canvas, colorPicker, lineWidth, fillMode, onChange, fontFamily, fontSize, options = {}) {
        this.undoStack = [];
        this.redoStack = [];
        this.currentTool = null;
        this.baseGridSpacing = 50;
        this.minGridSpacingPx = 25;
        this.majorLineFrequency = 4;
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
            this.updateOverlays();
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
        this.gridOverlay = options.gridOverlay ?? null;
        this.gridCtx = this.gridOverlay ? this.gridOverlay.getContext("2d") : null;
        this.horizontalRuler = options.horizontalRuler ?? null;
        this.verticalRuler = options.verticalRuler ?? null;
        this.gridVisible = options.initialGridVisible ?? true;
        this.zoom = options.initialZoom ?? 1;
        this.adjustForPixelRatio();
        this.setGridVisible(this.gridVisible);
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
        const dpr = this.devicePixelRatio;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Reset any existing transforms
        this.ctx.scale(1, 1);
        this.updateOverlays();
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
    setGridVisible(visible) {
        this.gridVisible = visible;
        if (this.gridOverlay) {
            this.gridOverlay.style.visibility = visible ? "visible" : "hidden";
        }
        this.renderGrid();
    }
    toggleGrid() {
        const next = !this.gridVisible;
        this.setGridVisible(next);
        return next;
    }
    isGridVisible() {
        return this.gridVisible;
    }
    setZoom(zoom) {
        if (!Number.isFinite(zoom) || zoom <= 0)
            return;
        this.zoom = zoom;
        this.updateOverlays();
    }
    get zoomLevel() {
        return this.zoom;
    }
    get devicePixelRatio() {
        return window.devicePixelRatio || 1;
    }
    updateOverlays() {
        this.renderGrid();
        this.renderRulers();
    }
    renderGrid() {
        if (!this.gridOverlay || !this.gridCtx)
            return;
        const rect = this.canvas.getBoundingClientRect();
        const dpr = this.devicePixelRatio;
        const width = Math.max(0, rect.width);
        const height = Math.max(0, rect.height);
        this.gridOverlay.width = Math.max(1, Math.round(width * dpr));
        this.gridOverlay.height = Math.max(1, Math.round(height * dpr));
        const ctx = this.gridCtx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.gridOverlay.width, this.gridOverlay.height);
        if (!this.gridVisible) {
            return;
        }
        ctx.scale(dpr, dpr);
        ctx.lineWidth = 1 / dpr;
        const { spacing, majorFrequency } = this.getGridMetrics();
        if (!isFinite(spacing) || spacing <= 0) {
            return;
        }
        const limitX = width;
        const limitY = height;
        const maxColumns = Math.ceil(limitX / spacing) + 1;
        const maxRows = Math.ceil(limitY / spacing) + 1;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
        ctx.beginPath();
        for (let i = 0; i <= maxColumns; i++) {
            if (i % majorFrequency === 0)
                continue;
            const x = i * spacing;
            if (x > limitX + 1)
                break;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, limitY);
        }
        for (let i = 0; i <= maxRows; i++) {
            if (i % majorFrequency === 0)
                continue;
            const y = i * spacing;
            if (y > limitY + 1)
                break;
            ctx.moveTo(0, y);
            ctx.lineTo(limitX, y);
        }
        ctx.stroke();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
        ctx.beginPath();
        for (let i = 0; i <= maxColumns; i++) {
            if (i % majorFrequency !== 0)
                continue;
            const x = i * spacing;
            if (x > limitX + 1)
                break;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, limitY);
        }
        for (let i = 0; i <= maxRows; i++) {
            if (i % majorFrequency !== 0)
                continue;
            const y = i * spacing;
            if (y > limitY + 1)
                break;
            ctx.moveTo(0, y);
            ctx.lineTo(limitX, y);
        }
        ctx.stroke();
    }
    renderRulers() {
        const hasHorizontal = Boolean(this.horizontalRuler);
        const hasVertical = Boolean(this.verticalRuler);
        if (!hasHorizontal && !hasVertical)
            return;
        const canvasRect = this.canvas.getBoundingClientRect();
        const dpr = this.devicePixelRatio;
        if (this.horizontalRuler) {
            const rect = this.horizontalRuler.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.horizontalRuler.width = Math.max(1, Math.round(rect.width * dpr));
                this.horizontalRuler.height = Math.max(1, Math.round(rect.height * dpr));
                const ctx = this.horizontalRuler.getContext("2d");
                if (ctx) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, this.horizontalRuler.width, this.horizontalRuler.height);
                    ctx.scale(dpr, dpr);
                    this.drawRuler(ctx, canvasRect.width, rect.height, "horizontal");
                }
            }
        }
        if (this.verticalRuler) {
            const rect = this.verticalRuler.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                this.verticalRuler.width = Math.max(1, Math.round(rect.width * dpr));
                this.verticalRuler.height = Math.max(1, Math.round(rect.height * dpr));
                const ctx = this.verticalRuler.getContext("2d");
                if (ctx) {
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.clearRect(0, 0, this.verticalRuler.width, this.verticalRuler.height);
                    ctx.scale(dpr, dpr);
                    this.drawRuler(ctx, canvasRect.height, rect.width, "vertical");
                }
            }
        }
    }
    drawRuler(ctx, length, thickness, orientation) {
        const dpr = this.devicePixelRatio;
        ctx.save();
        ctx.lineWidth = 1 / dpr;
        const width = orientation === "horizontal" ? length : thickness;
        const height = orientation === "horizontal" ? thickness : length;
        ctx.fillStyle = "#f8f8f8";
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = "#d0d0d0";
        ctx.beginPath();
        if (orientation === "horizontal") {
            ctx.moveTo(0, thickness - 0.5);
            ctx.lineTo(length, thickness - 0.5);
        }
        else {
            ctx.moveTo(thickness - 0.5, 0);
            ctx.lineTo(thickness - 0.5, length);
        }
        ctx.stroke();
        const { spacing, majorFrequency, unit } = this.getGridMetrics();
        if (!isFinite(spacing) || spacing <= 0) {
            ctx.restore();
            return;
        }
        const tickLong = thickness * 0.65;
        const tickShort = thickness * 0.4;
        const maxTicks = Math.ceil(length / spacing) + 1;
        ctx.strokeStyle = "#999";
        ctx.beginPath();
        for (let i = 0; i <= maxTicks; i++) {
            const pos = i * spacing;
            if (pos > length + 1)
                break;
            const isMajor = i % majorFrequency === 0;
            const tick = isMajor ? tickLong : tickShort;
            if (orientation === "horizontal") {
                ctx.moveTo(pos, thickness);
                ctx.lineTo(pos, thickness - tick);
            }
            else {
                ctx.moveTo(thickness, pos);
                ctx.lineTo(thickness - tick, pos);
            }
        }
        ctx.stroke();
        ctx.fillStyle = "#555";
        ctx.font = "10px sans-serif";
        const labelOffset = thickness - tickLong - 4;
        for (let i = 0; i <= maxTicks; i++) {
            if (i % majorFrequency !== 0)
                continue;
            const pos = i * spacing;
            if (pos > length + 1)
                break;
            const value = Math.round(i * unit);
            const label = String(value);
            if (orientation === "horizontal") {
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(label, pos, labelOffset);
            }
            else {
                ctx.save();
                ctx.translate(labelOffset, pos);
                ctx.rotate(-Math.PI / 2);
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(label, 0, 0);
                ctx.restore();
            }
        }
        ctx.restore();
    }
    getGridMetrics() {
        let spacing = this.baseGridSpacing * this.zoom;
        let unit = this.baseGridSpacing;
        if (!isFinite(spacing) || spacing <= 0) {
            spacing = this.baseGridSpacing;
            unit = this.baseGridSpacing;
        }
        while (spacing < this.minGridSpacingPx) {
            spacing *= 2;
            unit *= 2;
        }
        while (spacing > this.minGridSpacingPx * 4) {
            spacing /= 2;
            unit /= 2;
        }
        const majorFrequency = Math.max(1, this.majorLineFrequency);
        return { spacing, unit, majorFrequency };
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
    }
}
