import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

export class TextTool implements Tool {


  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";

    textarea.style.left = `${e.offsetX}px`;
    textarea.style.top = `${e.offsetY}px`;
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;

      if (text) {
        editor.ctx.fillStyle = editor.strokeStyle;
        editor.ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
        editor.ctx.fillText(text, e.offsetX, e.offsetY);

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
    textarea.addEventListener("keydown", this.keydownListener);

  }

  destroy(): void {
    this.cleanup();
  }

  /**
   * Remove textarea overlay and any registered listeners.
   */
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
