import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class EraserTool implements Tool {

  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1) return;

