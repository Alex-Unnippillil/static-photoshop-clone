import type { Tool } from './Tool';
import type { Editor } from '../core/Editor';

export class RectangleTool implements Tool {
  private drawing = false;
  private startX = 0;
  private startY = 0;

  onMouseDown(e: MouseEvent, editor: Editor): void {
    this.drawing = true;
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    editor.saveState();
  }

  onMouseMove(_e: MouseEvent, _editor: Editor): void {
    // No live preview
  }

  onMouseUp(e: MouseEvent, editor: Editor): void {
    if (!this.drawing) return;
    this.drawing = false;
    editor.ctx.lineWidth = editor.lineWidth;
    editor.ctx.strokeStyle = editor.color;
    const x = e.offsetX;
    const y = e.offsetY;
    editor.ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
  }
}
