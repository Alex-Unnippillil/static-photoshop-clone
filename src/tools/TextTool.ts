import { Editor } from "../core/Editor";
import { Tool } from "./Tool";

/**
 * Tool for placing text onto the canvas.
 *
 * When the user clicks on the canvas a textarea is overlaid at the click
 * position allowing the user to enter text. Pressing <Enter> commits the
 * text to the canvas while <Escape> cancels the operation. Blur will also
 * commit the text. All DOM event listeners and overlays are cleaned up when
 * the text is committed, cancelled or when the tool is destroyed.
 */
export class TextTool implements Tool {
  cursor = "text";

  private textarea: HTMLTextAreaElement | null = null;
  private blurListener: ((e: FocusEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  private startX = 0;
  private startY = 0;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    // Ensure any previous overlays are removed before creating a new one.
    this.cleanup();

    this.startX = e.offsetX;
    this.startY = e.offsetY;

    const textarea = document.createElement("textarea");
    textarea.style.position = "absolute";
    textarea.style.left = `${e.offsetX}px`;
    textarea.style.top = `${e.offsetY}px`;
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.border = "1px dashed #666";
    textarea.style.background = "transparent";
    textarea.style.resize = "none";
    textarea.style.overflow = "hidden";
    textarea.style.outline = "none";
    textarea.style.lineHeight = "1";
    textarea.style.color = editor.strokeStyle;
    textarea.style.fontSize = `${editor.lineWidthValue * 4}px`;
    textarea.rows = 1;

    const parent = editor.canvas.parentElement || document.body;
    parent.appendChild(textarea);
    textarea.focus();

    const commit = () => {
      const value = textarea.value;
      this.cleanup();
      if (value) {
        editor.ctx.fillStyle = editor.strokeStyle;
        editor.ctx.font = `${editor.lineWidthValue * 4}px sans-serif`;
        editor.ctx.fillText(value, this.startX, this.startY);
      }
    };

    const cancel = () => {
      this.cleanup();
      // Editor.saveState() is called before onPointerDown in Editor.
      // Cancelling should revert to that state.
      editor.undo();
    };

    this.blurListener = () => commit();
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

  // Text tool does not react to pointer moves.
  onPointerMove(_e: PointerEvent, _editor: Editor): void {
    /* no-op */
  }

  // No specific action on pointer up as text is committed via keyboard/blur.
  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    /* no-op */
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

