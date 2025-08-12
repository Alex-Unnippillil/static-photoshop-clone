export class Editor {
    constructor(canvas, tools) {
        this.undoStack = [];
        this.redoStack = [];
        this.color = '#000000';
        this.lineWidth = 5;
        this.tools = {};
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Canvas context not available');
        this.ctx = ctx;
        this.tools = tools;
        const first = Object.keys(tools)[0];
        this.currentTool = tools[first];
        this.attachEvents();
    }
    attachEvents() {
        this.canvas.addEventListener('mousedown', e => this.currentTool.onMouseDown(e, this));
        this.canvas.addEventListener('mousemove', e => this.currentTool.onMouseMove(e, this));
        this.canvas.addEventListener('mouseup', e => this.currentTool.onMouseUp(e, this));
    }
    useTool(name) {
        const tool = this.tools[name];
        if (tool)
            this.currentTool = tool;
    }
    saveState() {
        this.undoStack.push(this.canvas.toDataURL());
        if (this.undoStack.length > 50)
            this.undoStack.shift();
        this.redoStack.length = 0;
    }
    restore(stack, opposite) {
        if (!stack.length)
            return;
        opposite.push(this.canvas.toDataURL());
        const img = new Image();
        img.src = stack.pop();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
    }
    undo() {
        this.restore(this.undoStack, this.redoStack);
    }
    redo() {
        this.restore(this.redoStack, this.undoStack);
    }
}
