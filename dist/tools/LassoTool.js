export class LassoTool {
    constructor() {
        this.cursor = "crosshair";
        this.points = [];
        this.drawing = false;
        this.closed = false;
        this.committed = false;
        this.overlay = null;
        this.overlayCtx = null;
        this.editor = null;
        this.selectionMask = null;
    }
    onPointerDown(e, editor) {
        this.editor = editor;
        this.ensureOverlay(editor);
        this.resetPath(this.committed);
        this.drawing = true;
        this.closed = false;
        this.committed = false;
        this.selectionMask = null;
        this.points = [this.eventToPoint(e, editor)];
        this.renderOverlay();
        this.emitState();
    }
    onPointerMove(e, editor) {
        if (!this.drawing || this.closed || e.buttons === 0)
            return;
        const point = this.eventToPoint(e, editor);
        const last = this.points[this.points.length - 1];
        if (!last || Math.hypot(point.x - last.x, point.y - last.y) >= 1) {
            this.points.push(point);
            this.renderOverlay();
            this.emitState();
        }
    }
    onPointerUp(_e, _editor) {
        if (!this.drawing)
            return;
        this.drawing = false;
        this.emitState();
    }
    closePath() {
        if (this.closed || this.points.length < 3)
            return;
        this.closed = true;
        this.generateMask();
        this.renderOverlay();
        this.emitState();
    }
    commitSelection() {
        if (!this.closed || !this.selectionMask || !this.editor)
            return;
        this.editor.setSelectionMask(this.selectionMask);
        this.committed = true;
        this.renderOverlay();
        this.emitState();
    }
    cancelSelection() {
        if (!this.editor)
            return;
        this.resetPath(this.committed);
        this.renderOverlay();
        this.emitState();
    }
    destroy() {
        this.removeOverlay();
        this.points = [];
        this.selectionMask = null;
    }
    get state() {
        return {
            isDrawing: this.drawing,
            hasPath: this.points.length > 1,
            canClose: !this.closed && this.points.length >= 3,
            isClosed: this.closed,
            canCommit: this.closed && !!this.selectionMask,
            hasSelection: this.committed,
        };
    }
    eventToPoint(e, editor) {
        const rect = editor.canvas.getBoundingClientRect();
        const scaleX = editor.canvas.width / rect.width;
        const scaleY = editor.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }
    ensureOverlay(editor) {
        if (this.overlay && this.overlayCtx) {
            this.syncOverlaySize(editor);
            return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = editor.canvas.width;
        canvas.height = editor.canvas.height;
        canvas.style.pointerEvents = "none";
        canvas.classList.add("lasso-overlay");
        editor.canvas.parentElement?.appendChild(canvas);
        this.overlay = canvas;
        this.overlayCtx = canvas.getContext("2d");
        this.syncOverlaySize(editor);
    }
    syncOverlaySize(editor) {
        if (!this.overlay)
            return;
        if (this.overlay.width !== editor.canvas.width) {
            this.overlay.width = editor.canvas.width;
        }
        if (this.overlay.height !== editor.canvas.height) {
            this.overlay.height = editor.canvas.height;
        }
    }
    renderOverlay() {
        if (!this.overlayCtx || !this.overlay)
            return;
        const ctx = this.overlayCtx;
        ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        if (this.points.length < 2)
            return;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0, 123, 255, 0.8)";
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i += 1) {
            const pt = this.points[i];
            ctx.lineTo(pt.x, pt.y);
        }
        if (this.closed) {
            ctx.closePath();
        }
        ctx.stroke();
        if (this.closed) {
            ctx.fillStyle = this.committed
                ? "rgba(0, 123, 255, 0.1)"
                : "rgba(0, 123, 255, 0.2)";
            ctx.fill();
        }
        ctx.restore();
    }
    generateMask() {
        if (!this.editor || this.points.length < 3) {
            this.selectionMask = null;
            return;
        }
        const offscreen = document.createElement("canvas");
        offscreen.width = this.editor.canvas.width;
        offscreen.height = this.editor.canvas.height;
        const ctx = offscreen.getContext("2d");
        if (!ctx) {
            this.selectionMask = null;
            return;
        }
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i += 1) {
            const pt = this.points[i];
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.fill();
        const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const { data, width, height } = imageData;
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let hasMask = false;
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const alpha = data[(y * width + x) * 4 + 3];
                if (alpha !== 0) {
                    hasMask = true;
                    if (x < minX)
                        minX = x;
                    if (y < minY)
                        minY = y;
                    if (x > maxX)
                        maxX = x;
                    if (y > maxY)
                        maxY = y;
                }
            }
        }
        if (!hasMask) {
            this.selectionMask = null;
            return;
        }
        this.selectionMask = {
            width,
            height,
            data: new Uint8ClampedArray(data),
            path: this.points.map((pt) => ({ ...pt })),
            bounds: {
                x: minX,
                y: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1,
            },
        };
    }
    resetPath(clearSelection) {
        this.points = [];
        this.closed = false;
        this.committed = false;
        this.selectionMask = null;
        if (clearSelection && this.editor) {
            this.editor.clearSelectionMask();
        }
    }
    removeOverlay() {
        if (this.overlay?.parentElement) {
            this.overlay.parentElement.removeChild(this.overlay);
        }
        this.overlay = null;
        this.overlayCtx = null;
    }
    emitState() {
        this.onStateChange?.(this.state);
    }
}
