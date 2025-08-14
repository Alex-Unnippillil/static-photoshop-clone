import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;

    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.outline = "none";
    textarea.style.resize = "none";


    const commit = () => {
      if (!this.textarea) return;
      const text = this.textarea.value;

      if (!text) return;
      const ctx = editor.ctx;
      ctx.fillStyle = editor.strokeStyle;
      ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;

      if (ev.key === "Enter") {
        ev.preventDefault();
        commit();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        cancel();
      }

  }

  onPointerMove(_e: PointerEvent, _editor: Editor) {
    // No operation
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    if (this.textarea && document.activeElement !== this.textarea) {
      this.cleanup();
    }
  }

  destroy() {
    this.cleanup();
  }

  private cleanup() {
    if (!this.textarea) return;
    if (this.blurListener) {
      this.textarea.removeEventListener("blur", this.blurListener);
    }
    if (this.keydownListener) {
      this.textarea.removeEventListener("keydown", this.keydownListener);
    }
    this.textarea.remove();
    this.textarea = null;
    this.blurListener = null;
    this.keydownListener = null;
  }
}
