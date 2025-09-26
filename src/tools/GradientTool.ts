import { Editor } from "../core/Editor.js";
import { Tool } from "./Tool.js";

export type GradientType = "linear" | "radial";

export interface GradientStop {
  id: number;
  offset: number;
  color: string;
}

export interface GradientConfig {
  type: GradientType;
  stops: GradientStop[];
  addListener(listener: () => void): () => void;
  notifyChange(): void;
}

const STOP_RADIUS = 6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export class GradientTool implements Tool {
  cursor = "crosshair";

  private readonly config: GradientConfig;
  private start: { x: number; y: number } | null = null;
  private end: { x: number; y: number } | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private baseImage: ImageData | null = null;
  private previewing = false;
  private draggingStop: GradientStop | null = null;
  private removeListener: (() => void) | null = null;

  constructor(config: GradientConfig) {
    this.config = config;
    this.removeListener = this.config.addListener(() => {
      if (!this.start || !this.end) return;
      if (this.previewing) {
        this.renderPreview(this.lastEditor);
      } else {
        this.renderHandles(this.lastEditor);
      }
    });
  }

  private lastEditor: Editor | null = null;

  onPointerDown(e: PointerEvent, editor: Editor): void {
    this.lastEditor = editor;
    if (this.start && this.end) {
      const hitStop = this.hitTestStop(e);
      if (hitStop) {
        this.draggingStop = hitStop;
        return;
      }
    }

    this.start = { x: e.offsetX, y: e.offsetY };
    this.end = { x: e.offsetX, y: e.offsetY };
    this.previewing = true;
    this.draggingStop = null;
    this.captureBaseImage(editor);
    this.ensureOverlay(editor);
    this.renderPreview(editor);
  }

  onPointerMove(e: PointerEvent, editor: Editor): void {
    this.lastEditor = editor;
    if (this.draggingStop && this.start && this.end) {
      const offset = this.offsetFromPointer(e);
      if (offset !== null) {
        this.draggingStop.offset = clamp(offset, 0, 1);
        this.sortStops();
        this.applyGradientToCanvas(editor);
        this.renderHandles(editor);
        this.config.notifyChange();
      }
      return;
    }

    if (!this.previewing || !this.start || !this.end || e.buttons !== 1) {
      return;
    }

    this.end = { x: e.offsetX, y: e.offsetY };
    this.renderPreview(editor);
  }

  onPointerUp(e: PointerEvent, editor: Editor): void {
    this.lastEditor = editor;
    if (this.draggingStop) {
      this.draggingStop = null;
      this.sortStops();
      this.config.notifyChange();
      return;
    }

    if (!this.previewing || !this.start || !this.end) {
      return;
    }

    this.previewing = false;
    this.applyGradientToCanvas(editor);
    this.renderHandles(editor);
  }

  destroy(): void {
    this.cleanupOverlay();
    this.baseImage = null;
    this.start = null;
    this.end = null;
    this.draggingStop = null;
    this.removeListener?.();
    this.removeListener = null;
  }

  private captureBaseImage(editor: Editor) {
    try {
      this.baseImage = editor.ctx.getImageData(
        0,
        0,
        editor.canvas.width,
        editor.canvas.height,
      );
    } catch {
      this.baseImage = null;
    }
  }

  private ensureOverlay(editor: Editor) {
    const parent = editor.canvas.parentElement || editor.canvas;
    if (!this.overlayCanvas) {
      this.overlayCanvas = document.createElement("canvas");
      this.overlayCanvas.style.position = "absolute";
      this.overlayCanvas.style.top = "0";
      this.overlayCanvas.style.left = "0";
      this.overlayCanvas.style.pointerEvents = "none";
      parent.appendChild(this.overlayCanvas);
    }

    const rect = editor.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.overlayCanvas.width = rect.width * dpr;
    this.overlayCanvas.height = rect.height * dpr;
    this.overlayCanvas.style.width = `${rect.width}px`;
    this.overlayCanvas.style.height = `${rect.height}px`;

    const ctx = this.overlayCanvas.getContext("2d");
    if (!ctx) {
      this.overlayCanvas.remove();
      this.overlayCanvas = null;
      this.overlayCtx = null;
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.overlayCtx = ctx;
  }

  private cleanupOverlay() {
    this.overlayCtx = null;
    if (this.overlayCanvas) {
      this.overlayCanvas.remove();
      this.overlayCanvas = null;
    }
  }

  private renderPreview(editor: Editor | null) {
    if (!editor || !this.start || !this.end) return;
    this.ensureOverlay(editor);
    if (!this.overlayCanvas || !this.overlayCtx) return;

    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    const gradient = this.createGradient(this.overlayCtx);
    if (!gradient) {
      return;
    }

    this.overlayCtx.save();
    this.overlayCtx.globalAlpha = 0.75;
    this.overlayCtx.fillStyle = gradient;
    this.overlayCtx.fillRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.overlayCtx.restore();
    this.drawHandles();
  }

  private renderHandles(editor: Editor | null) {
    if (!editor || !this.start || !this.end) return;
    this.ensureOverlay(editor);
    if (!this.overlayCanvas || !this.overlayCtx) return;
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.drawHandles();
  }

  private drawHandles() {
    if (!this.overlayCtx || !this.start || !this.end) return;
    const ctx = this.overlayCtx;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(this.start.x, this.start.y);
    ctx.lineTo(this.end.x, this.end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const stops = [...this.config.stops].sort((a, b) => a.offset - b.offset);
    for (const stop of stops) {
      const pos = this.positionForOffset(stop.offset);
      if (!pos) continue;
      ctx.beginPath();
      ctx.fillStyle = stop.color;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
      ctx.lineWidth = 1;
      ctx.arc(pos.x, pos.y, STOP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private createGradient(
    ctx: CanvasRenderingContext2D,
  ): CanvasGradient | null {
    if (!this.start || !this.end) return null;
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;

    let gradient: CanvasGradient | null = null;
    if (this.config.type === "linear") {
      if (typeof ctx.createLinearGradient !== "function" || (dx === 0 && dy === 0)) {
        return null;
      }
      gradient = ctx.createLinearGradient(this.start.x, this.start.y, this.end.x, this.end.y);
    } else {
      const radius = Math.hypot(dx, dy);
      if (typeof ctx.createRadialGradient !== "function" || radius === 0) {
        return null;
      }
      gradient = ctx.createRadialGradient(
        this.start.x,
        this.start.y,
        0,
        this.start.x,
        this.start.y,
        radius,
      );
    }

    const stops = [...this.config.stops].sort((a, b) => a.offset - b.offset);
    stops.forEach((stop) => {
      gradient!.addColorStop(clamp(stop.offset, 0, 1), stop.color);
    });

    return gradient;
  }

  private applyGradientToCanvas(editor: Editor) {
    if (!this.start || !this.end) return;
    const ctx = editor.ctx;
    if (this.baseImage) {
      ctx.putImageData(this.baseImage, 0, 0);
    }
    const gradient = this.createGradient(ctx);
    if (!gradient) return;
    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, editor.canvas.width, editor.canvas.height);
    ctx.restore();
  }

  private positionForOffset(offset: number) {
    if (!this.start || !this.end) return null;
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    if (this.config.type === "linear") {
      return {
        x: this.start.x + dx * offset,
        y: this.start.y + dy * offset,
      };
    }

    const length = Math.hypot(dx, dy);
    if (length === 0) return null;
    const ux = dx / length;
    const uy = dy / length;
    return {
      x: this.start.x + ux * length * offset,
      y: this.start.y + uy * length * offset,
    };
  }

  private offsetFromPointer(e: PointerEvent): number | null {
    if (!this.start || !this.end) return null;
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    if (this.config.type === "linear") {
      const lengthSq = dx * dx + dy * dy;
      if (lengthSq === 0) return null;
      const t =
        ((e.offsetX - this.start.x) * dx + (e.offsetY - this.start.y) * dy) / lengthSq;
      return t;
    }
    const radius = Math.hypot(dx, dy);
    if (radius === 0) return null;
    const dist = Math.hypot(e.offsetX - this.start.x, e.offsetY - this.start.y);
    return dist / radius;
  }

  private hitTestStop(e: PointerEvent): GradientStop | null {
    if (!this.start || !this.end) return null;
    const stops = [...this.config.stops].sort((a, b) => a.offset - b.offset);
    for (const stop of stops) {
      const pos = this.positionForOffset(stop.offset);
      if (!pos) continue;
      const dist = Math.hypot(e.offsetX - pos.x, e.offsetY - pos.y);
      if (dist <= STOP_RADIUS * 1.5) {
        return stop;
      }
    }
    return null;
  }

  private sortStops() {
    this.config.stops.sort((a, b) => a.offset - b.offset);
  }
}
