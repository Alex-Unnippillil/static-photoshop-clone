import { DrawingTool } from "./DrawingTool.js";
export class PencilTool extends DrawingTool {
    onPointerDown(e, editor) {
        this.applyStroke(editor.ctx, editor);
        const ctx = editor.ctx;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
        editor.showBrushPreview(e.offsetX, e.offsetY);
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1) {
            editor.showBrushPreview(e.offsetX, e.offsetY);
            return;
        }
        this.applyStroke(editor.ctx, editor);
        const ctx = editor.ctx;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        editor.showBrushPreview(e.offsetX, e.offsetY);
    }
    onPointerUp(e, editor) {
        editor.ctx.closePath();
        editor.showBrushPreview(e.offsetX, e.offsetY);
    }
}
