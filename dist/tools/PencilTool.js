import { DrawingTool } from "./DrawingTool.js";
export class PencilTool extends DrawingTool {
    onPointerDown(e, editor) {
        this.applyStroke(editor.ctx, editor);
        const ctx = editor.ctx;
        const { x, y } = editor.getCanvasPoint(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1)
            return;
        this.applyStroke(editor.ctx, editor);
        const ctx = editor.ctx;
        const { x, y } = editor.getCanvasPoint(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    onPointerUp(_e, editor) {
        editor.ctx.closePath();
    }
}
