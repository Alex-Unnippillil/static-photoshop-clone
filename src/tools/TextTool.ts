import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

export class TextTool implements Tool {
  textarea: HTMLTextAreaElement | null = null;
  blurListener: ((this: HTMLTextAreaElement, ev: FocusEvent) => void) | null = null;
  keydownListener:
    | ((this: HTMLTextAreaElement, ev: KeyboardEvent) => void)
    | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();
    const snapped = editor.snapPoint(e.offsetX, e.offsetY);
    const x = snapped.x;
    const y = snapped.y;
    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    const parent = editor.canvas.parentElement || document.body;
    textarea.style.left = `${x}px`;
    textarea.style.top = `${y}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.fontSizeValue}px`;
    textarea.style.fontFamily = editor.fontFamilyValue;
    textarea.style.background = "transparent";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    parent.appendChild(textarea);
    textarea.focus();
    if (snapped.snapped) {
      editor.showSnapGuides({ point: { x, y } });
    } else {
      editor.clearSnapGuides();
    }

    const commit = () => {
      const text = textarea.value;
      this.cleanup();
      if (text) {
        editor.ctx.fillStyle = editor.strokeStyle;
        editor.ctx.font = `${editor.fontSizeValue}px ${editor.fontFamilyValue}`;
        editor.ctx.fillText(text, x, y);
      }
      editor.clearSnapGuides();
    };

    const cancel = () => {
      this.cleanup();
      editor.clearSnapGuides();
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    /* no-op */
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
}
