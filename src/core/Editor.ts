// Editor.ts - manages canvas history using ImageData snapshots.
// Each snapshot stores pixel data (width * height * 4 bytes). Keeping many
// snapshots can consume significant memory, so history length is capped.

export class Editor {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private readonly historyLimit: number;

  constructor(canvas: HTMLCanvasElement, historyLimit: number = 20) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to acquire 2D context');
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.historyLimit = historyLimit;
  }

  /**
   * Capture the current canvas state using getImageData.
   * Caps the number of stored states to avoid high memory usage.
   */
  saveState(): void {
    const snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.historyLimit) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  /** Restore previous state if available. */
  undo(): void {
    if (!this.undoStack.length) return;
    const current = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.redoStack.push(current);
    const previous = this.undoStack.pop()!;
    this.ctx.putImageData(previous, 0, 0);
  }

  /** Re-apply a state from the redo stack if available. */
  redo(): void {
    if (!this.redoStack.length) return;
    const current = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(current);
    const next = this.redoStack.pop()!;
    this.ctx.putImageData(next, 0, 0);
  }
}

