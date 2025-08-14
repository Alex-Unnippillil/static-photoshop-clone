import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Tool for adding text to the canvas. When activated it creates a textarea
 * overlay positioned where the pointer was pressed. The text is committed to
 * the canvas on blur or when the user presses Enter and cancelled on Escape.
 */
export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: ((e: FocusEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.cleanup();

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    textarea.style.left = `${e.offsetX}px`;
    textarea.style.top = `${e.offsetY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.style.background = "transparent";
    textarea.style.border = "none";
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.outline = "none";
    textarea.style.resize = "none";

    document.body.appendChild(textarea);
    textarea.focus();
    this.textarea = textarea;

    const commit = () => {
      if (!this.textarea) return;
      const text = this.textarea.value;
      if (text) {
        const ctx = editor.ctx;
        ctx.fillStyle = editor.strokeStyle;
        ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
        ctx.fillText(text, e.offsetX, e.offsetY);
      }
      this.cleanup();
    };

    const cancel = () => {
      this.cleanup();
    };

    this.blurListener = () => commit();
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

