import type { Tool } from './Tool';
import type { Editor } from '../core/Editor';

export class PencilTool implements Tool {
  private drawing = false;

  onMouseDown(e: MouseEvent, editor: Editor): void {
    this.drawing = true;
    editor.ctx.lineWidth = editor.lineWidth;
    editor.ctx.strokeStyle = editor.color;
    editor.ctx.beginPath();
    editor.ctx.moveTo(e.offsetX, e.offsetY);
    editor.saveState();
  }

  onMouseMove(e: MouseEvent, editor: Editor): void {
    if (!this.drawing) return;
    editor.ctx.lineTo(e.offsetX, e.offsetY);
    editor.ctx.stroke();
  }

  onMouseUp(_e: MouseEvent, _editor: Editor): void {
    this.drawing = false;
  }
}
