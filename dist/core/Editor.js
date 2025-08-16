export class Editor {
    constructor(canvas, colorPicker, lineWidth, fillMode) {
        this.undoStack = [];
        this.redoStack = [];
        this.currentTool = null;
        this.handlePointerDown = (e) => {
            this.saveState();
            this.currentTool?.onPointerDown(e, this);
        };
        this.handlePointerMove = (e) => {
            this.currentTool?.onPointerMove(e, this);
        };
        this.handlePointerUp = (e) => {
            this.currentTool?.onPointerUp(e, this);
        };
        this.handleResize = () => {
            const data = this.canvas.toDataURL();
            this.adjustForPixelRatio();
            const img = new Image();
            img.src = data;
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
            };
        };
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            throw new Error("Unable to get 2D context");
        this.ctx = ctx;
        this.colorPicker = colorPicker;
        this.lineWidth = lineWidth;
        this.fillMode = fillMode;
        this.adjustForPixelRatio();
        window.addEventListener("resize", this.handleResize);
        this.canvas.addEventListener("pointerdown", this.handlePointerDown);
        this.canvas.addEventListener("pointermove", this.handlePointerMove);
        this.canvas.addEventListener("pointerup", this.handlePointerUp);
    }
    setTool(tool) {
        this.currentTool?.destroy?.();
        this.currentTool = tool;
    }
    adjustForPixelRatio() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        if ("setTransform" in this.ctx) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        if ("scale" in this.ctx) {
            this.ctx.scale(dpr, dpr);
        }
    }
    saveState() {
        this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        if (this.undoStack.length > 50)
            this.undoStack.shift();
        this.redoStack.length = 0;
    }
    restoreState(stack, opposite) {
        if (!stack.length)
            return;
        opposite.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        const imageData = stack.pop();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.putImageData(imageData, 0, 0);
    }
    undo() {
        this.restoreState(this.undoStack, this.redoStack);
    }
    redo() {
        this.restoreState(this.redoStack, this.undoStack);
    }
    get strokeStyle() {
        return this.colorPicker.value;
    }
    get lineWidthValue() {
        return parseInt(this.lineWidth.value, 10) || 1;
    }
    get fill() {
        return this.fillMode.checked;
    }
    get fillStyle() {
        return this.colorPicker.value;
    }
    /**
     * Remove all event listeners registered by the editor.
     * Should be called before discarding the instance to prevent leaks.
     */
    destroy() {
        this.currentTool?.destroy?.();
        window.removeEventListener("resize", this.handleResize);
        this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
        this.canvas.removeEventListener("pointermove", this.handlePointerMove);
        this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    }
}
