import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  textarea: HTMLTextAreaElement | null = null;
  blurListener: ((e: FocusEvent) => void) | null = null;
  keydownListener: ((e: KeyboardEvent) => void) | null = null;
  cursor = "text";

  onPointerDown(e: PointerEvent, editor: Editor): void {
    if (this.textarea) {
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
    textarea.style.border = "none";
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.outline = "none";
    textarea.style.resize = "none";

    const container = editor.canvas.parentElement || document.body;
    container.appendChild(textarea);
    textarea.focus();

    const commit = () => this.commit(editor, x, y);
    const cancel = () => this.cleanup();

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

  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // no-op
  }

  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    // no-op
  }

  private commit(editor: Editor, x: number, y: number): void {
    if (!this.textarea) return;
    const text = this.textarea.value;
    if (text) {
      const ctx = editor.ctx;
      ctx.fillStyle = editor.strokeStyle;
      ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
      ctx.fillText(text, x, y);
    }
    this.cleanup();
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

