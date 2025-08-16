import { Editor } from "../core/Editor";
import { Tool } from "./Tool";



    (editor.canvas.parentElement || document.body).appendChild(textarea);
    textarea.focus();


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

