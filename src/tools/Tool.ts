import type { Editor } from '../core/Editor';

export interface Tool {
  onMouseDown(e: MouseEvent, editor: Editor): void;
  onMouseMove(e: MouseEvent, editor: Editor): void;
  onMouseUp(e: MouseEvent, editor: Editor): void;
}
