import { DrawingTool } from "./DrawingTool";
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
        this.imageData = ctx.getImageData
            ? ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height)
            : null;
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1 || !this.imageData)
            return;
        const ctx = editor.ctx;
        ctx.putImageData?.(this.imageData, 0, 0);
        this.applyStroke(editor.ctx, editor);
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        ctx.closePath();
    }
    onPointerUp(e, editor) {
        this.applyStroke(editor.ctx, editor);
        const ctx = editor.ctx;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        ctx.closePath();
        this.imageData = null;
    }
}
