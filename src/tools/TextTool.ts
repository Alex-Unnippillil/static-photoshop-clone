import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private x = 0;
  private y = 0;
  private blurListener: (() => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.cleanup();
    this.x = e.offsetX;
    this.y = e.offsetY;

    const textarea = document.createElement("textarea");
    this.textarea = textarea;
    const container = editor.canvas.parentElement || document.body;
    textarea.style.position = "absolute";
    textarea.style.left = `${this.x}px`;
    textarea.style.top = `${this.y}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.style.background = "transparent";
    textarea.style.border = "none";
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    container.appendChild(textarea);
    textarea.focus();

    const commit = () => {
      if (!this.textarea) return;
      const text = this.textarea.value;
      this.cleanup();
      if (!text) return;
      const ctx = editor.ctx;
      ctx.fillStyle = editor.strokeStyle;
      ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
      ctx.fillText(text, this.x, this.y);
    };

    const cancel = () => {
      this.cleanup();
    };

    this.blurListener = commit;
    this.keydownListener = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        commit();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        cancel();
      }
    };

    textarea.addEventListener("blur", this.blurListener);
    textarea.addEventListener("keydown", this.keydownListener);
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
