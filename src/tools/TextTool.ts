import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Tool for placing text on the canvas. A textarea is created at the
 * pointer position, allowing the user to type before committing the
 * text to the canvas.
 */
export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: (() => void) | null = null;
  private keydownListener: ((ev: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();

    const ta = document.createElement("textarea");
    const x = e.offsetX;
    const y = e.offsetY;
    ta.style.position = "absolute";
    ta.style.left = `${x}px`;
    ta.style.top = `${y}px`;
    ta.style.color = this.hexToRgb(editor.strokeStyle);
    ta.style.fontSize = `${editor.lineWidthValue * 4}px`;
    document.body.appendChild(ta);
    ta.focus();

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

    ta.addEventListener("blur", this.blurListener);
    ta.addEventListener("keydown", this.keydownListener);

    this.textarea = ta;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // no-op
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

  private hexToRgb(hex: string): string {
    const v = hex.replace("#", "");
    const r = parseInt(v.substring(0, 2), 16);
    const g = parseInt(v.substring(2, 4), 16);
    const b = parseInt(v.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

