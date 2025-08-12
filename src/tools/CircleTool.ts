import { Editor } from "../core/Editor";
import { DrawingTool } from "./DrawingTool";


  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    const ctx = editor.ctx;
    this.imageData = ctx.getImageData(
      0,
      0,
      editor.canvas.width,
      editor.canvas.height,
    );
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    applyStroke(ctx, editor);
    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
  }

  onPointerUp(e: PointerEvent, editor: Editor) {
    const ctx = editor.ctx;

    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
    this.imageData = null;
  }
}

