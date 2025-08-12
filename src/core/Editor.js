// Generated from Editor.ts. Manages canvas history with ImageData snapshots.
// Keeping many ImageData objects uses a lot of memory; history is capped.

export class Editor {
  constructor(canvas, historyLimit = 20) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to acquire 2D context');
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.undoStack = [];
    this.redoStack = [];
    this.historyLimit = historyLimit;
  }

  saveState() {
    const snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.historyLimit) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  undo() {
    if (!this.undoStack.length) return;
    const current = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.redoStack.push(current);
    const previous = this.undoStack.pop();
    this.ctx.putImageData(previous, 0, 0);
  }

  redo() {
    if (!this.redoStack.length) return;
    const current = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(current);
    const next = this.redoStack.pop();
    this.ctx.putImageData(next, 0, 0);
  }
}

