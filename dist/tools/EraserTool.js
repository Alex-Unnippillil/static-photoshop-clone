import { DrawingTool } from "./DrawingTool.js";
export class EraserTool extends DrawingTool {
    onPointerDown(e, editor) {
        const ctx = editor.ctx;
        ctx.globalCompositeOperation = "destination-out";
        this.applyStroke(ctx, editor);
        const { x, y } = editor.getCanvasPoint(e);
        const size = editor.lineWidthOnCanvas;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.clearRect(x - size / 2, y - size / 2, size, size);
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1)
            return;
        const ctx = editor.ctx;
        this.applyStroke(ctx, editor);
        const { x, y } = editor.getCanvasPoint(e);
        const size = editor.lineWidthOnCanvas;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.clearRect(x - size / 2, y - size / 2, size, size);
    }
    onPointerUp(_e, editor) {
        const ctx = editor.ctx;
        ctx.closePath();
        ctx.globalCompositeOperation = "source-over";
    }
}
