import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

export class TextTool implements Tool {
  private textarea: HTMLTextAreaElement | null = null;
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.cleanup(editor);
    this.startX = e.offsetX;
    this.startY = e.offsetY;

    const container = (editor.canvas.parentElement || document.body) as HTMLElement;
    const rect = editor.canvas.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    const fontSize = editor.lineWidthValue * 4;

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    textarea.style.left = `${rect.left - contRect.left + e.offsetX}px`;
    textarea.style.top = `${rect.top - contRect.top + e.offsetY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.font = `${fontSize}px sans-serif`;
    textarea.style.fontSize = `${fontSize}px`;
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.border = "none";
    textarea.style.background = "transparent";
    textarea.style.outline = "none";
    textarea.style.resize = "none";

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        this.commit(editor);
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        this.cancel(editor);
      }
    };

    textarea.addEventListener("keydown", handleKeyDown);
    textarea.addEventListener(
      "blur",
      () => {
        this.commit(editor);
      },
      { once: true },
    );

    container.appendChild(textarea);
    textarea.focus();
    this.textarea = textarea;
  }

  private commit(editor: Editor) {
    if (!this.textarea) return;
    const text = this.textarea.value;
    if (text) {
      const fontSize = editor.lineWidthValue * 4;
      editor.ctx.fillStyle = editor.strokeStyle;
      editor.ctx.font = `${fontSize}px sans-serif`;
      editor.ctx.fillText(text, this.startX, this.startY);
    }
    this.cleanup(editor);
  }

  private cancel(editor: Editor) {
    this.cleanup(editor);
  }

  private cleanup(editor?: Editor) {
    if (this.textarea) {
      this.textarea.remove();
      this.textarea = null;
    }
    editor?.canvas.focus();
  }

  onPointerMove(_e: PointerEvent, _editor: Editor) {
    // No operation
  }

  onPointerUp(_e: PointerEvent, _editor: Editor) {
    // No operation
  }
}

