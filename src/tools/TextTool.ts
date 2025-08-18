import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  cursor = "text";
  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: ((e: FocusEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();

    this.startX = e.offsetX;
    this.startY = e.offsetY;

    const textarea = document.createElement("textarea");
    this.textarea = textarea;
    textarea.style.position = "absolute";
    textarea.style.left = `${this.startX}px`;
    textarea.style.top = `${this.startY}px`;
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.border = "1px dashed #000";
    textarea.style.background = "transparent";
    textarea.style.color = this.hexToRgb(editor.strokeStyle);
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.style.fontFamily = "sans-serif";
    textarea.style.lineHeight = "1";

    const commit = () => {
      const value = textarea.value;
      if (value) {
        editor.ctx.fillStyle = editor.fillStyle;
        editor.ctx.fillText(value, this.startX, this.startY);
        try {
          editor.saveState();
        } catch {
          /* ignore if context doesn't support getImageData */
        }
      }
      this.cleanup();
    };

    const cancel = () => this.cleanup();

    this.blurListener = () => commit();
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

    (editor.canvas.parentElement || document.body).appendChild(textarea);
    textarea.focus();
  }

  onPointerMove(): void {}
  onPointerUp(): void {}

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

