import { Editor } from "../core/Editor";
import { Tool } from "./Tool";






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

    textarea.addEventListener("blur", this.blurListener);
    textarea.addEventListener("keydown", this.keydownListener);


  onPointerMove(e: PointerEvent, editor: Editor): void {
    void e;
    void editor;
  }


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

  private hexToRgb(hex: string): string {
    const v = hex.replace("#", "");
    const r = parseInt(v.substring(0, 2), 16);
    const g = parseInt(v.substring(2, 4), 16);
    const b = parseInt(v.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;


