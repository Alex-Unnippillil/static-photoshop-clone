import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Tool for placing text onto the canvas.
 */
export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: ((e: FocusEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    textarea.style.left = `${e.offsetX}px`;
    textarea.style.top = `${e.offsetY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.font = `${editor.lineWidthValue * 4}px sans-serif`;
    document.body.appendChild(textarea);
    textarea.focus();

    const x = e.offsetX;
    const y = e.offsetY;

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

    this.blurListener = commit;
    textarea.addEventListener("blur", commit);

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
  onPointerMove(_e: PointerEvent, _editor: Editor): void {}

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

