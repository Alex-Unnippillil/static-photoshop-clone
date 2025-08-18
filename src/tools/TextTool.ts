import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

export class TextTool implements Tool {
  textarea: HTMLTextAreaElement | null = null;
  blurListener: ((e: FocusEvent) => void) | null = null;
  keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    const parent = editor.canvas.parentElement || document.body;
    textarea.style.left = `${e.offsetX}px`;
    textarea.style.top = `${e.offsetY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.style.fontFamily = "sans-serif";
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
        editor.ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
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

  onPointerMove(): void {}

  onPointerUp(): void {}

  destroy(): void {
    this.cleanup();
  }

  /**
   * Remove textarea overlay and any registered listeners.
   */
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

