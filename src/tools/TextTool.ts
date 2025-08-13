import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    // Close any existing textarea before creating a new one
    this.textarea?.blur();

    const canvas = editor.canvas;
    const container = canvas.parentElement || document.body;
    const textarea = document.createElement("textarea");
    this.textarea = textarea;

    const fontSize = editor.lineWidthValue * 4;
    const rect = canvas.getBoundingClientRect();

    textarea.style.position = "absolute";
    textarea.style.left = `${rect.left + e.offsetX}px`;
    textarea.style.top = `${rect.top + e.offsetY - fontSize}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.font = `${fontSize}px sans-serif`;
    textarea.style.background = "transparent";
    textarea.style.border = "none";
    textarea.style.margin = "0";
    textarea.style.padding = "0";
    textarea.style.outline = "none";
    textarea.style.resize = "none";

    container.appendChild(textarea);
    textarea.focus();

    const finalize = () => {
      const text = textarea.value;
      if (text) {
        const ctx = editor.ctx;
        ctx.fillStyle = editor.strokeStyle;
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillText(text, e.offsetX, e.offsetY);
      }
      textarea.removeEventListener("blur", finalize);
      textarea.removeEventListener("keydown", handleKey);
      textarea.remove();
      this.textarea = null;
    };

    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        finalize();
      }
    };

    textarea.addEventListener("blur", finalize);
    textarea.addEventListener("keydown", handleKey);
  }

  onPointerMove(_e: PointerEvent, _editor: Editor) {
    // No operation
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // No operation
  }
}

