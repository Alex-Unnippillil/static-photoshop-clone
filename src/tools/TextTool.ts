import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, editor: Editor) {
    if (this.textarea) return; // prevent multiple overlays

    this.startX = e.offsetX;
    this.startY = e.offsetY;

    const textarea = document.createElement("textarea");
    this.textarea = textarea;
    textarea.style.position = "absolute";
    const container = editor.canvas.parentElement || document.body;
    const canvasRect = editor.canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    textarea.style.left = `${canvasRect.left - containerRect.left + this.startX}px`;
    textarea.style.top = `${canvasRect.top - containerRect.top + this.startY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.style.border = "1px solid";
    textarea.style.background = "transparent";
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.outline = "none";
    textarea.style.resize = "none";

    const commit = () => {
      if (!this.textarea) return;
      const text = this.textarea.value;
      container.removeChild(this.textarea);
      this.textarea = null;
      if (!text) return;
      const ctx = editor.ctx;
      ctx.fillStyle = editor.strokeStyle;
      ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
      ctx.fillText(text, this.startX, this.startY);
    };

    const cancel = () => {
      if (!this.textarea) return;
      container.removeChild(this.textarea);
      this.textarea = null;
    };

    textarea.addEventListener("blur", commit, { once: true });
    textarea.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        commit();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        cancel();
      }
    });

    container.appendChild(textarea);
    textarea.focus();
  }

  onPointerMove(_e: PointerEvent, _editor: Editor) {
    // No operation
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // No operation
  }
}

