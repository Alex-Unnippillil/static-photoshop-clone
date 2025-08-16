import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Simple text tool that creates a textarea overlay on the canvas where the
 * user clicked. Text is committed on Enter or blur, and cancelled on Escape.
 */
export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: ((e: Event) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();

    const { offsetX: x, offsetY: y } = e;

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    textarea.style.left = `${x}px`;
    textarea.style.top = `${y}px`;
    textarea.style.color = this.hexToRgb(editor.strokeStyle);
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.style.border = "none";
    textarea.style.background = "transparent";

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
    document.body.appendChild(textarea);
    textarea.focus();

    this.textarea = textarea;
  }

  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // No preview behaviour
  }

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

  private hexToRgb(hex: string): string {
    const v = hex.replace("#", "");
    const r = parseInt(v.substring(0, 2), 16);
    const g = parseInt(v.substring(2, 4), 16);
    const b = parseInt(v.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

