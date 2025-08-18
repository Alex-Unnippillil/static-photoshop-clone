import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

/**
 * Tool that sprays random dots while the pointer is pressed.
 */
export class SprayTool extends DrawingTool {
  private interval: number | null = null;
  private x = 0;
  private y = 0;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.x = e.offsetX;
    this.y = e.offsetY;
    const ctx = editor.ctx;
    // spray immediately then start interval
    this.spray(ctx, editor);
    this.interval = window.setInterval(() => this.spray(ctx, editor), 25);
  }

  onPointerMove(e: PointerEvent, _editor: Editor): void {
    if (e.buttons !== 1) return;
    this.x = e.offsetX;
    this.y = e.offsetY;
  }

  onPointerUp(_e: PointerEvent, _editor: Editor): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  destroy(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private spray(ctx: CanvasRenderingContext2D, editor: Editor): void {
    this.applyStroke(ctx, editor);
    const radius = editor.lineWidthValue;
    const count = radius; // number of dots per tick proportional to brush size
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const x = this.x + Math.cos(angle) * r;
      const y = this.y + Math.sin(angle) * r;
      ctx.fillRect(x, y, editor.lineWidthValue, editor.lineWidthValue);
    }
  }
}

