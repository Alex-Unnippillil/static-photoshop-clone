import { Editor } from "../core/Editor";

export interface Tool {
  onPointerDown(e: PointerEvent, editor: Editor): void;
  onPointerMove(e: PointerEvent, editor: Editor): void;
  onPointerUp(e: PointerEvent, editor: Editor): void;
}
