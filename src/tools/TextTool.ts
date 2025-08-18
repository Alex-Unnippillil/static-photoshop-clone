import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool for adding text to the canvas. Displays a textarea overlay at the
 * pointer location and commits the text to the canvas when Enter is pressed
 * or the textarea loses focus. Pressing Escape cancels the operation.
 */
export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: ((e: FocusEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();

    const textarea = document.createElement("textarea");
    this.textarea = textarea;
    textarea.style.position = "absolute";
    textarea.style.left = `${e.offsetX}px`;
    textarea.style.top = `${e.offsetY}px`;
    textarea.style.background = "transparent";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;

    const commit = () => {
      if (!this.textarea) return;
      editor.ctx.fillText(this.textarea.value, e.offsetX, e.offsetY);
      editor.saveState();
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

    editor.canvas.parentElement?.appendChild(textarea);
    textarea.focus();
  }

  onPointerMove(_e: PointerEvent, _editor: Editor): void {}

  onPointerUp(_e: PointerEvent, _editor: Editor): void {}

  destroy(): void {
    this.cleanup();
  }

  /** Remove textarea overlay and any registered listeners. */
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

