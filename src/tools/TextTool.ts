import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  textarea: HTMLTextAreaElement | null = null;
  blurListener: ((ev: FocusEvent) => void) | null = null;
  keydownListener: ((ev: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    // If an existing textarea is not focused, remove it
    if (this.textarea && document.activeElement !== this.textarea) {
      this.cleanup();
    }

    const textarea = document.createElement("textarea");
    this.textarea = textarea;

    const x = e.offsetX;
    const y = e.offsetY;

    textarea.style.position = "absolute";
    textarea.style.left = `${x}px`;
    textarea.style.top = `${y}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.style.background = "transparent";
    textarea.style.border = "1px dashed";
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.outline = "none";
    textarea.style.resize = "none";

    (editor.canvas.parentElement || document.body).appendChild(textarea);
    textarea.focus();

    const commit = () => {
      if (!this.textarea) return;
      const text = this.textarea.value;
      if (text) {
        const ctx = editor.ctx;
        ctx.fillStyle = editor.strokeStyle;
        ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
        ctx.fillText(text, x, y);
      }
      this.cleanup();
    };

    const cancel = () => this.cleanup();

    this.blurListener = cancel;
    textarea.addEventListener("blur", this.blurListener);

    this.keydownListener = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        commit();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        cancel();
      }
    };
    textarea.addEventListener("keydown", this.keydownListener);
  }

  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // Text tool does not draw during pointer move
  }

  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // Nothing to do on pointer up for text tool
  }

  destroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
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

