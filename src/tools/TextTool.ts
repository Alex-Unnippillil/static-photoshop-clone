import { Editor } from "../core/Editor";
import { Tool } from "./Tool";



  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.cleanup();
    this.x = e.offsetX;
    this.y = e.offsetY;


    const commit = () => {
      if (!this.textarea) return;
      const text = this.textarea.value;
      if (text) {
        const ctx = editor.ctx;
        ctx.fillStyle = editor.strokeStyle;
        ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
        ctx.fillText(text, this.x, this.y);
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

    this.textarea = ta;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPointerMove(_e: PointerEvent, _editor: Editor): void {

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
