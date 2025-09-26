export class HandTool {
    constructor() {
        this.cursor = "grab";
        this.dragging = false;
        this.startX = 0;
        this.startY = 0;
        this.startScrollLeft = 0;
        this.startScrollTop = 0;
        this.pointerId = null;
    }
    onPointerDown(e, editor) {
        const container = editor.scrollContainer;
        if (!container)
            return;
        this.dragging = true;
        this.pointerId = e.pointerId;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startScrollLeft = container.scrollLeft;
        this.startScrollTop = container.scrollTop;
        editor.setCursor("grabbing");
        e.preventDefault();
    }
    onPointerMove(e, editor) {
        if (!this.dragging || (this.pointerId !== null && e.pointerId !== this.pointerId)) {
            return;
        }
        const container = editor.scrollContainer;
        if (!container)
            return;
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        container.scrollLeft = this.startScrollLeft - dx;
        container.scrollTop = this.startScrollTop - dy;
        e.preventDefault();
    }
    onPointerUp(_e, editor) {
        if (!this.dragging)
            return;
        this.dragging = false;
        this.pointerId = null;
        editor.setCursor();
    }
}
