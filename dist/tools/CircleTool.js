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
        this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1 || !this.imageData)
            return;
        const ctx = editor.ctx;
        ctx.putImageData(this.imageData, 0, 0);
        this.applyStroke(ctx, editor);
        const dx = e.offsetX - this.startX;
        const dy = e.offsetY - this.startY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
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
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (editor.fill) {
            ctx.fill();
        }
        ctx.closePath();
        this.imageData = null;
    }
}
