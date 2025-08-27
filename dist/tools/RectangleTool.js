import { DrawingTool } from "./DrawingTool.js";
export class RectangleTool extends DrawingTool {
    constructor() {
        super(...arguments);
        this.startX = 0;
        this.startY = 0;
        this.imageData = null;
    }
    onPointerDown(e, editor) {
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        this.applyStroke(editor.ctx, editor);
        const ctx = editor.ctx;
        this.imageData = ctx.getImageData(0, 0, editor.canvas.width, editor.canvas.height);
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1 || !this.imageData)
            return;
        const ctx = editor.ctx;
        ctx.putImageData(this.imageData, 0, 0);
        this.applyStroke(editor.ctx, editor);
        const x = e.offsetX;
        const y = e.offsetY;
        let width = x - this.startX;
        let height = y - this.startY;
        if (e.shiftKey) {
            const size = Math.min(Math.abs(width), Math.abs(height));
            width = size * Math.sign(width);
            height = size * Math.sign(height);
        }
        ctx.strokeRect(this.startX, this.startY, width, height);
        if (editor.fill) {
            ctx.fillRect(this.startX, this.startY, width, height);
        }
    }
    onPointerUp(e, editor) {
        const ctx = editor.ctx;
        if (this.imageData) {
            ctx.putImageData(this.imageData, 0, 0);
        }
        this.applyStroke(editor.ctx, editor);
        const x = e.offsetX;
        const y = e.offsetY;
        let width = x - this.startX;
        let height = y - this.startY;
        if (e.shiftKey) {
            const size = Math.min(Math.abs(width), Math.abs(height));
            width = size * Math.sign(width);
            height = size * Math.sign(height);
        }
        ctx.strokeRect(this.startX, this.startY, width, height);
        if (editor.fill) {
            ctx.fillRect(this.startX, this.startY, width, height);
        }
        this.imageData = null;
    }
}
