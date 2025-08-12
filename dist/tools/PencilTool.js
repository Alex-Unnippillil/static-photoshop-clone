export class PencilTool {
    constructor() {
        this.drawing = false;
    }
    onMouseDown(e, editor) {
        this.drawing = true;
        editor.ctx.lineWidth = editor.lineWidth;
        editor.ctx.strokeStyle = editor.color;
        editor.ctx.beginPath();
        editor.ctx.moveTo(e.offsetX, e.offsetY);
        editor.saveState();
    }
    onMouseMove(e, editor) {
        if (!this.drawing)
            return;
        editor.ctx.lineTo(e.offsetX, e.offsetY);
        editor.ctx.stroke();
    }
    onMouseUp(_e, _editor) {
        this.drawing = false;
    }
}
