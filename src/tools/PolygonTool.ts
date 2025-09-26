import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

const SNAP_ANGLE = Math.PI / 12; // 15 degrees

export class PolygonTool extends DrawingTool {
  private startX = 0;
  private startY = 0;
  private imageData: ImageData | null = null;
  private lockedRadius: number | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    this.lockedRadius = null;
    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);
    if (typeof ctx.getImageData === "function") {
      this.imageData = ctx.getImageData(
        0,
        0,
        editor.canvas.width,
        editor.canvas.height,
      );
    } else {
      this.imageData = null;
    }
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    if (e.buttons !== 1 || !this.imageData) return;
    const ctx = editor.ctx;
    ctx.putImageData(this.imageData, 0, 0);
    this.applyStroke(ctx, editor);
    this.drawPolygon(ctx, editor, e);
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    const ctx = editor.ctx;
    if (this.imageData) {
      ctx.putImageData(this.imageData, 0, 0);
    }
    this.applyStroke(ctx, editor);
    this.drawPolygon(ctx, editor, e);
    this.imageData = null;
    this.lockedRadius = null;
  }

  private drawPolygon(
    ctx: CanvasRenderingContext2D,
    editor: Editor,
    e: PointerEvent,
  ) {
    const dx = e.offsetX - this.startX;
    const dy = e.offsetY - this.startY;
    let radius = Math.hypot(dx, dy);
    if (radius < 0.5) {
      return;
    }

    let angle = Math.atan2(dy, dx);
    if (e.shiftKey) {
      angle = Math.round(angle / SNAP_ANGLE) * SNAP_ANGLE;
    }

    if (e.altKey) {
      if (this.lockedRadius === null) {
        this.lockedRadius = radius;
      }
      radius = this.lockedRadius;
    } else {
      this.lockedRadius = null;
    }

    const sides = Math.max(3, editor.polygonVertexCount);
    const isStar = editor.polygonStarMode;
    const inset = Math.max(0.05, Math.min(0.95, editor.polygonStarInset));
    const step = (Math.PI * 2) / sides;

    ctx.beginPath();
    if (isStar) {
      const innerRadius = radius * inset;
      for (let i = 0; i < sides; i += 1) {
        const outerAngle = angle + step * i;
        const innerAngle = outerAngle + step / 2;
        const outerX = this.startX + Math.cos(outerAngle) * radius;
        const outerY = this.startY + Math.sin(outerAngle) * radius;
        const innerX = this.startX + Math.cos(innerAngle) * innerRadius;
        const innerY = this.startY + Math.sin(innerAngle) * innerRadius;
        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        ctx.lineTo(innerX, innerY);
      }
    } else {
      for (let i = 0; i < sides; i += 1) {
        const theta = angle + step * i;
        const x = this.startX + Math.cos(theta) * radius;
        const y = this.startY + Math.sin(theta) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    }

    ctx.closePath();
    ctx.stroke();
    if (editor.fill) {
      ctx.fill();
    }
  }
}
