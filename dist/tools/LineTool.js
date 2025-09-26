import { DrawingTool } from "./DrawingTool.js";
export class LineTool extends DrawingTool {
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
        const { x, y } = this.calculateEndPoint(e);
        editor.withPreviewContext((ctx) => {
            this.applyStroke(ctx, editor);
            ctx.globalAlpha = 0.8;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.closePath();
        });
    }
    onPointerUp(e, editor) {
        const ctx = editor.ctx;
        const { x, y } = this.calculateEndPoint(e);
        editor.clearPreview();
        this.applyStroke(ctx, editor);
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
    }
    calculateEndPoint(e) {
        let x = e.offsetX;
        let y = e.offsetY;
        if (e.shiftKey) {
            const dx = x - this.startX;
            const dy = y - this.startY;
            const angle = Math.atan2(dy, dx);
            const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const length = Math.sqrt(dx * dx + dy * dy);
            x = this.startX + length * Math.cos(snapped);
            y = this.startY + length * Math.sin(snapped);
        }
        return { x, y };
    }
}
