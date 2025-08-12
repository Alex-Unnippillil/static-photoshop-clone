export class RectangleTool {
    constructor() {
        this.drawing = false;
        this.startX = 0;
        this.startY = 0;
    }
    onMouseDown(e, editor) {
        this.drawing = true;
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        editor.saveState();
    }
    onMouseMove(_e, _editor) {
        // No live preview
    }
    onMouseUp(e, editor) {
        if (!this.drawing)
            return;
        this.drawing = false;
        editor.ctx.lineWidth = editor.lineWidth;
        editor.ctx.strokeStyle = editor.color;
        const x = e.offsetX;
        const y = e.offsetY;
        editor.ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
    }
}
