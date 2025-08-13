import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    const canvas = editor.canvas;
    const container = canvas.parentElement || document.body;
    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    textarea.style.left = `${canvas.offsetLeft + e.offsetX}px`;
    textarea.style.top = `${canvas.offsetTop + e.offsetY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.style.background = "transparent";
    textarea.style.border = "1px solid " + editor.strokeStyle;
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    container.appendChild(textarea);
    textarea.focus();
    this.textarea = textarea;

    const finalize = () => {
      const text = textarea.value;
      if (text) {
        const ctx = editor.ctx;
        ctx.fillStyle = editor.strokeStyle;
        ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
        ctx.fillText(text, e.offsetX, e.offsetY);
      }
      textarea.remove();
      this.textarea = null;
    };

    textarea.addEventListener("blur", finalize, { once: true });
    textarea.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        textarea.blur();
      }
    });
  }

  onPointerMove(_e: PointerEvent, _editor: Editor) {
    // No operation
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // No operation
  }
}

