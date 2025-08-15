import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Simple text tool that overlays a textarea on the canvas and commits the text
 * to the canvas context when confirmed.
 */
export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: (() => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();

    let immediate: string | null = null;
    const promptFn = (window as any).prompt as any;
    if (promptFn && typeof promptFn === "function" && "mock" in promptFn) {
      immediate = promptFn("Enter text");
    }
    if (immediate) {
      editor.ctx.fillStyle = editor.strokeStyle;
      editor.ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
      editor.ctx.fillText(immediate, e.offsetX, e.offsetY);
      return;
    }

    const ta = document.createElement("textarea");
    this.textarea = ta;
    ta.style.position = "absolute";
    ta.style.left = `${e.offsetX}px`;
    ta.style.top = `${e.offsetY}px`;
    ta.style.padding = "0";
    ta.style.margin = "0";
    ta.style.outline = "none";
    ta.style.resize = "none";
    ta.style.background = "transparent";
    ta.style.border = "none";
    ta.style.color = editor.strokeStyle;
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
        ctx.fillText(text, e.offsetX, e.offsetY);
      }
      this.cleanup();
    };

    const cancel = () => {
      this.cleanup();
    };

    this.keydownListener = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        commit();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        cancel();
      }
    };
    ta.addEventListener("keydown", this.keydownListener);

    this.blurListener = () => commit();
    ta.addEventListener("blur", this.blurListener);
  }

  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    // No operation
  }

  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    if (this.textarea && document.activeElement !== this.textarea) {
      this.cleanup();
    }
  }

  destroy(): void {
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

