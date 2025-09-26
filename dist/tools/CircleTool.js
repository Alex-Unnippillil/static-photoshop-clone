import { DrawingTool } from "./DrawingTool.js";
export class CircleTool extends DrawingTool {
    constructor() {
        super(...arguments);
        this.startX = 0;
        this.startY = 0;
    }
    onPointerDown(e, editor) {
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        editor.clearPreview();
    }
    onPointerMove(e, editor) {
        if (e.buttons !== 1) {
            editor.clearPreview();
            return;
        }
        const { radiusX, radiusY } = this.calculateRadii(e);
        editor.withPreviewContext((ctx) => {
            this.applyStroke(ctx, editor);
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
            if (editor.fill) {
                ctx.globalAlpha = 0.3;
                ctx.fill();
            }
            ctx.closePath();
        });
    }
    onPointerUp(e, editor) {
        const ctx = editor.ctx;
        const { radiusX, radiusY } = this.calculateRadii(e);
        editor.clearPreview();
        this.applyStroke(ctx, editor);
        ctx.beginPath();
        ctx.ellipse(this.startX, this.startY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (editor.fill) {
            ctx.fill();
        }
        ctx.closePath();
    }
    calculateRadii(e) {
        const dx = e.offsetX - this.startX;
        const dy = e.offsetY - this.startY;
        let radiusX = Math.abs(dx);
        let radiusY = Math.abs(dy);
        if (e.shiftKey) {
            const radius = Math.max(radiusX, radiusY);
            radiusX = radius;
            radiusY = radius;
        }
        return { radiusX, radiusY };
    }
}
