import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  onPointerDown(e: PointerEvent, editor: Editor) {
    const text = prompt("Enter text:") ?? "";
    if (!text) return;
    const ctx = editor.ctx;
    ctx.fillStyle = editor.strokeStyle;
    ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
    ctx.fillText(text, e.offsetX, e.offsetY);
  }

  onPointerMove(_e: PointerEvent, _editor: Editor) {
    // No operation
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // No operation
  }
}

