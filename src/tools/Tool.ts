import { Editor } from "../core/Editor";

export interface Tool {
  cursor?: string;
  onPointerDown(e: PointerEvent, editor: Editor): void;
  onPointerMove(e: PointerEvent, editor: Editor): void;
  onPointerUp(e: PointerEvent, editor: Editor): void;
  destroy?(): void;
}
