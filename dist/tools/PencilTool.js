import { DrawingTool } from "./DrawingTool";
export class PencilTool extends DrawingTool {
    onPointerDown(e, editor) {
        this.applyStroke(editor.ctx, editor);
        const ctx = editor.ctx;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1)
            return;
        this.applyStroke(editor.ctx, editor);
        const ctx = editor.ctx;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
    onPointerUp(_e, editor) {
        editor.ctx.closePath();
    }
}
