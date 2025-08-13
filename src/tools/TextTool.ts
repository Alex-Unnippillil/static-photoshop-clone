import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, editor: Editor) {
    const container = editor.canvas.parentElement || document.body;
    this.startX = e.offsetX;
    this.startY = e.offsetY;

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    textarea.style.left = `${this.startX}px`;
    textarea.style.top = `${this.startY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.font = `${editor.lineWidthValue * 4}px sans-serif`;
    textarea.style.background = "transparent";
    textarea.style.border = "none";
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.outline = "none";

    const remove = (draw: boolean) => {
      if (draw && textarea.value) {
        const ctx = editor.ctx;
        ctx.fillStyle = editor.strokeStyle;
        ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
        ctx.fillText(textarea.value, this.startX, this.startY);
      }
      textarea.remove();
      textarea.removeEventListener("blur", onBlur);
      textarea.removeEventListener("keydown", onKeyDown);
      this.textarea = null;
    };

    const onBlur = () => remove(true);
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        remove(true);
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        remove(false);
      }
    };

    textarea.addEventListener("blur", onBlur, { once: true });
    textarea.addEventListener("keydown", onKeyDown);
    container.appendChild(textarea);
    textarea.focus();
    this.textarea = textarea;
  }

  onPointerMove(_e: PointerEvent, _editor: Editor) {
    // No operation
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // No operation
  }
}
