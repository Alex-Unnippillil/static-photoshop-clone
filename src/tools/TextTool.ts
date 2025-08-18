import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: ((e: FocusEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();
    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    const parent = editor.canvas.parentElement || document.body;
    textarea.style.left = `${e.offsetX}px`;
    textarea.style.top = `${e.offsetY}px`;
    textarea.style.color = editor.strokeStyle;
    const fontSize = editor.lineWidthValue * 4;
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.fontFamily = "sans-serif";
    textarea.style.background = "transparent";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    parent.appendChild(textarea);
    textarea.focus();

    const pos = editor.getCanvasPoint(e);

    const commit = () => {
      const text = textarea.value;
      this.cleanup();
      if (text) {
        editor.ctx.fillStyle = editor.strokeStyle;
        const canvasFont = fontSize / editor.scale;
        editor.ctx.font = `${canvasFont}px sans-serif`;
        editor.ctx.fillText(text, pos.x, pos.y);
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

