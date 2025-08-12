import type { Tool } from '../tools/Tool';

export class Editor {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  undoStack: string[] = [];
  redoStack: string[] = [];
  color = '#000000';
  lineWidth = 5;
  private currentTool: Tool;
  private tools: Record<string, Tool> = {};

  constructor(canvas: HTMLCanvasElement, tools: Record<string, Tool>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
    this.tools = tools;
    const first = Object.keys(tools)[0] as keyof typeof tools;
    this.currentTool = tools[first] as Tool;
    this.attachEvents();
  }

  private attachEvents(): void {
    this.canvas.addEventListener('mousedown', e => this.currentTool.onMouseDown(e, this));
    this.canvas.addEventListener('mousemove', e => this.currentTool.onMouseMove(e, this));
    this.canvas.addEventListener('mouseup', e => this.currentTool.onMouseUp(e, this));
  }

  useTool(name: string): void {
    const tool = this.tools[name];
    if (tool) this.currentTool = tool;
  }

  saveState(): void {
    this.undoStack.push(this.canvas.toDataURL());
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  private restore(stack: string[], opposite: string[]): void {
    if (!stack.length) return;
    opposite.push(this.canvas.toDataURL());
    const img = new Image();
    img.src = stack.pop()!;
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
    };
  }

  undo(): void {
    this.restore(this.undoStack, this.redoStack);
  }

  redo(): void {
    this.restore(this.redoStack, this.undoStack);
  }
}
