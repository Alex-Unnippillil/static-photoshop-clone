import { DrawingTool } from "./DrawingTool.js";
export class CircleTool extends DrawingTool {
    constructor() {
        super(...arguments);
        this.startX = 0;
        this.startY = 0;
        this.imageData = null;
    }
    onPointerDown(e, editor) {
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        const ctx = editor.ctx;
        this.applyStroke(ctx, editor);
        if (typeof ctx.getImageData === "function") {
            this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
        }
        else {
            this.imageData = null;
        }
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1 || !this.imageData)
            return;
        const ctx = editor.ctx;
        ctx.putImageData(this.imageData, 0, 0);
        this.applyStroke(ctx, editor);
        const dx = e.offsetX - this.startX;
        const dy = e.offsetY - this.startY;
        let radiusX = Math.abs(dx);
        let radiusY = Math.abs(dy);
        if (e.shiftKey) {
            const radius = Math.max(radiusX, radiusY);
            radiusX = radius;
            radiusY = radius;
        }
        ctx.beginPath();
        ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (editor.fill) {
            ctx.fill();
        }
        ctx.closePath();
    }
    onPointerUp(e, editor) {
        const ctx = editor.ctx;
        if (this.imageData) {
            ctx.putImageData(this.imageData, 0, 0);
        }
        this.applyStroke(ctx, editor);
        const dx = e.offsetX - this.startX;
        const dy = e.offsetY - this.startY;
        let radiusX = Math.abs(dx);
        let radiusY = Math.abs(dy);
        if (e.shiftKey) {
            const radius = Math.max(radiusX, radiusY);
            radiusX = radius;
            radiusY = radius;
        }
        ctx.beginPath();
        ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (editor.fill) {
            ctx.fill();
        }
        ctx.closePath();
        this.imageData = null;
    }
}
