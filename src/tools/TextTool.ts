import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

export class TextTool implements Tool {
  textarea: HTMLTextAreaElement | null = null;
  blurListener: ((this: HTMLTextAreaElement, ev: FocusEvent) => void) | null = null;
  keydownListener:
    | ((this: HTMLTextAreaElement, ev: KeyboardEvent) => void)
    | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();
    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    const parent = editor.canvas.parentElement || document.body;
    textarea.style.left = `${e.offsetX}px`;
    textarea.style.top = `${e.offsetY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.fontSizeValue}px`;
    textarea.style.fontFamily = editor.fontFamilyValue;
    textarea.style.background = "transparent";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    parent.appendChild(textarea);
    textarea.focus();

    const commit = () => {
      const text = textarea.value;
      this.cleanup();
      if (text) {
        editor.ctx.fillStyle = editor.strokeStyle;
        editor.ctx.font = `${editor.fontSizeValue}px ${editor.fontFamilyValue}`;
        editor.ctx.fillText(text, e.offsetX, e.offsetY);
        editor.saveState();
      }
    };

    const cancel = () => {
      this.cleanup();
    };

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

    this.textarea = textarea;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    /* no-op */
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    if (this.textarea && document.activeElement !== this.textarea) {
      this.cleanup();
    }
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
