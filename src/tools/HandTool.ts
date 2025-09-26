import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

export class HandTool implements Tool {
  cursor = "grab";
  private dragging = false;
  private startX = 0;
  private startY = 0;
  private startScrollLeft = 0;
  private startScrollTop = 0;
  private pointerId: number | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    const container = editor.scrollContainer;
    if (!container) return;
    this.dragging = true;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startScrollLeft = container.scrollLeft;
    this.startScrollTop = container.scrollTop;
    editor.setCursor("grabbing");
    e.preventDefault();
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (!this.dragging || (this.pointerId !== null && e.pointerId !== this.pointerId)) {
      return;
    }
    const container = editor.scrollContainer;
    if (!container) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    container.scrollLeft = this.startScrollLeft - dx;
    container.scrollTop = this.startScrollTop - dy;
    e.preventDefault();
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    if (!this.dragging) return;
    this.dragging = false;
    this.pointerId = null;
    editor.setCursor();
  }
}
