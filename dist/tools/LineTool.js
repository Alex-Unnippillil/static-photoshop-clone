import { DrawingTool } from "./DrawingTool.js";
export class LineTool extends DrawingTool {
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
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        ctx.closePath();
    }
    onPointerUp(e, editor) {
        const ctx = editor.ctx;
        if (this.imageData) {
            ctx.putImageData(this.imageData, 0, 0);
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
