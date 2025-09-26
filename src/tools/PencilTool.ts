import { Editor } from "../core/Editor.js";
import { DrawingTool } from "./DrawingTool.js";

type Point = {
  x: number;
  y: number;
};

export class PencilTool extends DrawingTool {
  private static readonly SMOOTHING_WEIGHTS = [0.5, 0.3, 0.15, 0.05];

  private recentPoints: Point[] = [];
  private bufferedPoints: Point[] = [];
  private lastOutputPoint: Point | null = null;
  private isDrawing = false;
  private frameHandle: number | null = null;

  onPointerDown(e: PointerEvent, editor: Editor) {
    this.isDrawing = true;
    this.recentPoints = [];
    this.bufferedPoints = [];
    this.lastOutputPoint = null;
    this.cancelScheduledFlush();

    this.applyStroke(editor.ctx, editor);
    const startPoint = this.toPoint(e);
    this.recentPoints.push(startPoint);
    this.lastOutputPoint = startPoint;

    const ctx = editor.ctx;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(startPoint.x, startPoint.y);
    ctx.stroke();
  }

  onPointerMove(e: PointerEvent, editor: Editor) {
    if (!this.isDrawing || e.buttons !== 1) return;
    this.bufferedPoints.push(this.toPoint(e));
    this.scheduleFlush(editor);
  }

  onPointerUp(_e: PointerEvent, editor: Editor) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.cancelScheduledFlush();
    this.flushBufferedPoints(editor);
    editor.ctx.closePath();
    this.recentPoints = [];
    this.bufferedPoints = [];
    this.lastOutputPoint = null;
  }

  private toPoint(e: PointerEvent): Point {
    return { x: e.offsetX, y: e.offsetY };
  }

  private scheduleFlush(editor: Editor) {
    if (this.frameHandle !== null) return;
    this.frameHandle = window.requestAnimationFrame(() => {
      this.frameHandle = null;
      this.flushBufferedPoints(editor);
    });
  }

  private cancelScheduledFlush() {
    if (this.frameHandle !== null) {
      window.cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  private flushBufferedPoints(editor: Editor) {
    if (!this.bufferedPoints.length || !this.lastOutputPoint) {
      this.bufferedPoints = [];
      return;
    }

    const ctx = editor.ctx;
    this.applyStroke(ctx, editor);

    let lastPoint: Point = this.lastOutputPoint;
    for (const point of this.bufferedPoints) {
      this.recentPoints.push(point);
      if (this.recentPoints.length > PencilTool.SMOOTHING_WEIGHTS.length) {
        this.recentPoints.shift();
      }

      const smoothed = this.computeSmoothedPoint();
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(smoothed.x, smoothed.y);
      ctx.stroke();
      lastPoint = smoothed;
    }

    this.lastOutputPoint = lastPoint;
    this.bufferedPoints = [];
  }

  private computeSmoothedPoint(): Point {
    const points = this.recentPoints;
    const weights = PencilTool.SMOOTHING_WEIGHTS;
    const count = points.length;
    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;

    for (let i = 0; i < count; i++) {
      const point = points[count - 1 - i];
      const weight = weights[i] ?? 0;
      weightedX += point.x * weight;
      weightedY += point.y * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      const lastPoint = points[points.length - 1];
      return { x: lastPoint.x, y: lastPoint.y };
    }

    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
    };
  }
}
