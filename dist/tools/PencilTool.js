import { DrawingTool } from "./DrawingTool.js";
import { BrushEngine } from "./brush/BrushEngine.js";
export class PencilTool extends DrawingTool {
    constructor() {
        super(...arguments);
        this.brush = new BrushEngine();
        this.drawing = false;
        this.useFallback = false;
        this.lastPoint = null;
    }
    onPointerDown(e, editor) {
        const start = { x: e.offsetX, y: e.offsetY };
        this.lastPoint = start;
        this.useFallback = typeof editor.ctx.drawImage !== "function";
        this.drawing = true;
        this.applyStroke(editor.ctx, editor);
        if (this.useFallback) {
            const ctx = editor.ctx;
            if (typeof ctx.beginPath === "function" && typeof ctx.moveTo === "function") {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
            }
            return;
        }
        this.prepareInvisiblePath(editor.ctx, start);
        this.brush.beginStroke(editor.ctx, editor, start);
        this.brush.renderPreview(editor, start);
    }
    onPointerMove(e, editor) {
        const point = { x: e.offsetX, y: e.offsetY };
        if (this.useFallback) {
            if (e.buttons === 1 && this.drawing) {
                const ctx = editor.ctx;
                this.applyStroke(ctx, editor);
                if (typeof ctx.lineTo === "function")
                    ctx.lineTo(point.x, point.y);
                if (typeof ctx.stroke === "function")
                    ctx.stroke();
            }
            this.lastPoint = point;
            return;
        }
        if (e.buttons === 1 && this.drawing) {
            this.applyStroke(editor.ctx, editor);
            this.traceInvisibleSegment(editor.ctx, point);
            this.brush.continueStroke(editor.ctx, editor, point);
        }
        else {
            this.brush.renderPreview(editor, point);
        }
        this.lastPoint = point;
    }
    onPointerUp(e, editor) {
        const point = { x: e.offsetX, y: e.offsetY };
        this.drawing = false;
        if (this.useFallback) {
            const ctx = editor.ctx;
            if (typeof ctx.closePath === "function")
                ctx.closePath();
            this.lastPoint = null;
            return;
        }
        this.brush.endStroke();
        this.brush.renderPreview(editor, point);
        if (typeof editor.ctx.closePath === "function") {
            editor.ctx.closePath();
        }
        this.lastPoint = null;
    }
    onBrushSettingsChange(editor) {
        if (this.useFallback)
            return;
        this.brush.handleSettingsChange(editor);
    }
    prepareInvisiblePath(ctx, point) {
        if (typeof ctx.beginPath !== "function" || typeof ctx.moveTo !== "function") {
            return;
        }
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    }
    traceInvisibleSegment(ctx, point) {
        if (!this.lastPoint) {
            this.lastPoint = point;
            return;
        }
        if (typeof ctx.beginPath !== "function" ||
            typeof ctx.moveTo !== "function" ||
            typeof ctx.lineTo !== "function" ||
            typeof ctx.stroke !== "function") {
            this.lastPoint = point;
            return;
        }
        const prevAlpha = ctx.globalAlpha ?? 1;
        const hasSave = typeof ctx.save === "function";
        if (hasSave)
            ctx.save();
        try {
            ctx.globalAlpha = 0;
            ctx.beginPath();
            ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
        finally {
            ctx.globalAlpha = prevAlpha;
            if (hasSave)
                ctx.restore();
        }
    }
}
