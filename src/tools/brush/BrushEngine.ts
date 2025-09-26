import type { Editor } from "../../core/Editor.js";

export type BrushTipShape = "round" | "square";

export interface BrushSettings {
  size: number;
  color: string;
  hardness: number;
  spacing: number;
  shape: BrushTipShape;
}

interface Point {
  x: number;
  y: number;
}

interface ActiveStroke {
  settings: BrushSettings;
  stamp: HTMLCanvasElement;
  lastPoint: Point;
  distanceSinceLastStamp: number;
}

/**
 * BrushEngine is responsible for stamping brush tips along pointer movement.
 * It normalizes the editor brush settings (spacing, hardness, tip shape) and
 * handles caching generated brush stamps to avoid unnecessary work while
 * drawing or previewing.
 */
export class BrushEngine {
  private stampCache = new Map<string, HTMLCanvasElement>();
  private activeStroke: ActiveStroke | null = null;
  private previewPoint: Point | null = null;

  beginStroke(ctx: CanvasRenderingContext2D, editor: Editor, point: Point) {
    const settings = this.createSettings(editor);
    const stamp = this.getStamp(settings);
    this.activeStroke = {
      settings,
      stamp,
      lastPoint: point,
      distanceSinceLastStamp: 0,
    };
    this.drawStamp(ctx, stamp, point);
  }

  continueStroke(
    ctx: CanvasRenderingContext2D,
    editor: Editor,
    point: Point,
  ) {
    if (!this.activeStroke) {
      this.beginStroke(ctx, editor, point);
      return;
    }

    const stroke = this.activeStroke;
    const { stamp } = stroke;
    const spacing = Math.max(0.1, stroke.settings.spacing);
    const dx = point.x - stroke.lastPoint.x;
    const dy = point.y - stroke.lastPoint.y;
    const distance = Math.hypot(dx, dy);
    if (!isFinite(distance) || distance === 0) {
      return;
    }

    const dirX = dx / distance;
    const dirY = dy / distance;
    let remainingDistance = distance;
    let currentX = stroke.lastPoint.x;
    let currentY = stroke.lastPoint.y;
    let distanceSinceLast = stroke.distanceSinceLastStamp;

    while (distanceSinceLast + remainingDistance >= spacing) {
      const distanceToAdvance = spacing - distanceSinceLast;
      currentX += dirX * distanceToAdvance;
      currentY += dirY * distanceToAdvance;
      this.drawStamp(ctx, stamp, { x: currentX, y: currentY });
      remainingDistance -= distanceToAdvance;
      distanceSinceLast = 0;
    }

    stroke.distanceSinceLastStamp = distanceSinceLast + remainingDistance;
    stroke.lastPoint = point;
  }

  endStroke() {
    this.activeStroke = null;
  }

  renderPreview(editor: Editor, point: Point) {
    const settings = this.createSettings(editor);
    const stamp = this.getStamp(settings);
    this.previewPoint = point;
    editor.renderBrushPreview(stamp, point.x, point.y);
  }

  handleSettingsChange(editor: Editor) {
    if (!this.previewPoint) return;
    this.renderPreview(editor, this.previewPoint);
  }

  private getStamp(settings: BrushSettings): HTMLCanvasElement {
    const key = this.makeKey(settings);
    const cached = this.stampCache.get(key);
    if (cached) return cached;
    const stamp = this.buildStamp(settings);
    this.stampCache.set(key, stamp);
    return stamp;
  }

  private makeKey(settings: BrushSettings): string {
    const { size, hardness, spacing, shape, color } = settings;
    return [shape, size.toFixed(2), hardness.toFixed(2), spacing.toFixed(2), color]
      .join(":");
  }

  private createSettings(editor: Editor): BrushSettings {
    return {
      size: Math.max(1, editor.lineWidthValue),
      color: editor.strokeStyle,
      hardness: editor.brushHardnessValue,
      spacing: Math.max(0.1, editor.brushSpacingPx),
      shape: editor.brushTipShape,
    };
  }

  private drawStamp(
    ctx: CanvasRenderingContext2D,
    stamp: HTMLCanvasElement,
    point: Point,
  ) {
    if (typeof ctx.drawImage !== "function") {
      return;
    }
    const halfW = stamp.width / 2;
    const halfH = stamp.height / 2;
    ctx.drawImage(stamp, point.x - halfW, point.y - halfH);
  }

  private buildStamp(settings: BrushSettings): HTMLCanvasElement {
    const diameter = Math.max(1, settings.size);
    const size = Math.ceil(diameter);
    const stamp = document.createElement("canvas");
    stamp.width = size;
    stamp.height = size;
    if (!hasCanvasSupport()) {
      return stamp;
    }
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = stamp.getContext("2d");
    } catch {
      ctx = null;
    }
    if (!ctx) return stamp;

    const { r, g, b } = parseColor(settings.color);

    if (settings.shape === "round") {
      this.buildRoundStamp(ctx, size, r, g, b, settings.hardness);
    } else {
      this.buildSquareStamp(ctx, size, r, g, b, settings.hardness);
    }

    return stamp;
  }

  private buildRoundStamp(
    ctx: CanvasRenderingContext2D,
    size: number,
    r: number,
    g: number,
    b: number,
    hardness: number,
  ) {
    const radius = size / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.closePath();
    if (hardness >= 0.999) {
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fill();
      return;
    }
    const innerRadius = radius * Math.max(0, hardness);
    const gradient = ctx.createRadialGradient(
      radius,
      radius,
      innerRadius,
      radius,
      radius,
      radius,
    );
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private buildSquareStamp(
    ctx: CanvasRenderingContext2D,
    size: number,
    r: number,
    g: number,
    b: number,
    hardness: number,
  ) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, size, size);

    if (hardness >= 0.999) {
      return;
    }

    const softness = 1 - Math.max(0, hardness);
    const fade = (size / 2) * softness;
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";

    // Central solid area
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(fade, fade, size - fade * 2, size - fade * 2);

    // Horizontal fades
    if (fade > 0) {
      const horizontal = ctx.createLinearGradient(0, 0, fade, 0);
      horizontal.addColorStop(0, "rgba(0, 0, 0, 0)");
      horizontal.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = horizontal;
      ctx.fillRect(0, fade, fade, size - fade * 2);

      const horizontalRight = ctx.createLinearGradient(0, 0, fade, 0);
      horizontalRight.addColorStop(0, "rgba(0, 0, 0, 1)");
      horizontalRight.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = horizontalRight;
      ctx.fillRect(size - fade, fade, fade, size - fade * 2);

      const vertical = ctx.createLinearGradient(0, 0, 0, fade);
      vertical.addColorStop(0, "rgba(0, 0, 0, 0)");
      vertical.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = vertical;
      ctx.fillRect(fade, 0, size - fade * 2, fade);

      const verticalBottom = ctx.createLinearGradient(0, 0, 0, fade);
      verticalBottom.addColorStop(0, "rgba(0, 0, 0, 1)");
      verticalBottom.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = verticalBottom;
      ctx.fillRect(fade, size - fade, size - fade * 2, fade);

      // Corner fades using radial gradients
      this.applyCornerFade(ctx, 0, 0, fade, "tl");
      this.applyCornerFade(ctx, size, 0, fade, "tr");
      this.applyCornerFade(ctx, 0, size, fade, "bl");
      this.applyCornerFade(ctx, size, size, fade, "br");
    }

    ctx.restore();
  }

  private applyCornerFade(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    corner: "tl" | "tr" | "bl" | "br",
  ) {
    if (radius <= 0) return;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y);
    switch (corner) {
      case "tl":
        ctx.lineTo(x + radius, y);
        ctx.lineTo(x, y + radius);
        break;
      case "tr":
        ctx.lineTo(x - radius, y);
        ctx.lineTo(x, y + radius);
        break;
      case "bl":
        ctx.lineTo(x + radius, y);
        ctx.lineTo(x, y - radius);
        break;
      case "br":
        ctx.lineTo(x - radius, y);
        ctx.lineTo(x, y - radius);
        break;
    }
    ctx.closePath();
    ctx.fill();
  }
}

function parseColor(color: string): { r: number; g: number; b: number } {
  const trimmed = color.trim();
  const normalized = trimmed.toLowerCase();
  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        return { r, g, b };
      }
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
        return { r, g, b };
      }
    }
  }
  const rgbMatch = normalized.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return {
      r: parseInt(r, 10) || 0,
      g: parseInt(g, 10) || 0,
      b: parseInt(b, 10) || 0,
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function hasCanvasSupport(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return typeof (window as { CanvasRenderingContext2D?: unknown }).CanvasRenderingContext2D !== "undefined";
}
