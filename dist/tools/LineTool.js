import { DrawingTool } from "./DrawingTool.js";
export class LineTool extends DrawingTool {
    constructor() {
        super(...arguments);
        this.startX = 0;
        this.startY = 0;
        this.imageData = null;
    }
    onPointerDown(e, editor) {
        const ctx = editor.ctx;
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        this.imageData = ctx.getImageData
            ? ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height)
            : null;
    }
    onPointerMove(e, editor) {
        const ctx = editor.ctx;
        if (e.buttons !== 1 || !this.imageData)
            return;
        ctx.putImageData?.(this.imageData, 0, 0);
        this.applyStroke(ctx, editor);
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        ctx.closePath();
    }
    onPointerUp(e, editor) {
        const ctx = editor.ctx;
        if (this.imageData) {
            ctx.putImageData?.(this.imageData, 0, 0);
        }
        this.applyStroke(ctx, editor);
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        ctx.closePath();
        this.imageData = null;
    }
}
