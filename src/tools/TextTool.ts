import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

/**
 * Tool for entering text onto the canvas. When the user clicks on the
 * canvas, a temporary `<textarea>` is overlaid at the click position. The
 * text entered is committed to the canvas when the user presses Enter and
 * cancelled on Escape or blur.
 */
export class TextTool implements Tool {
  textarea: HTMLTextAreaElement | null = null;
  private blurListener: ((e: FocusEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    // Ensure no stray textarea remains from previous interactions.
    this.cleanup();

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";

    // Place the textarea relative to the canvas's parent, falling back to
    // the document body when the parent is unavailable.
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
        // Persist the state so the text can be undone/redone.
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

  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // TextTool does not draw during pointer movement.
  }

  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // If the textarea loses focus before the pointer is released, ensure it
    // is cleaned up to avoid lingering overlays.
    if (this.textarea && document.activeElement !== this.textarea) {
      this.cleanup();
    }
  }

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

