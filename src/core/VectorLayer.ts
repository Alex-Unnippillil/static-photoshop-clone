export interface BaseShape {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
  strokeLineCap?: CanvasLineCap;
  strokeLineJoin?: CanvasLineJoin;
  opacity?: number;
}

export interface RectShape extends BaseShape {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape extends BaseShape {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface EllipseShape extends BaseShape {
  type: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface LineShape extends BaseShape {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PolylineShape extends BaseShape {
  type: "polyline";
  points: Array<{ x: number; y: number }>;
  closed: boolean;
}

export type VectorShape =
  | RectShape
  | CircleShape
  | EllipseShape
  | LineShape
  | PolylineShape;

export interface VectorLayerDimensions {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export class VectorLayer {
  readonly shapes: VectorShape[];
  private readonly bounds: VectorLayerDimensions;

  constructor(shapes: VectorShape[], bounds?: Partial<VectorLayerDimensions>) {
    this.shapes = shapes;
    const width = bounds?.width ?? 1;
    const height = bounds?.height ?? 1;
    this.bounds = {
      minX: bounds?.minX ?? 0,
      minY: bounds?.minY ?? 0,
      width: width <= 0 ? 1 : width,
      height: height <= 0 ? 1 : height,
    };
  }

  isEmpty(): boolean {
    return this.shapes.length === 0;
  }

  render(
    ctx: CanvasRenderingContext2D,
    targetWidth?: number,
    targetHeight?: number,
  ): void {
    if (this.shapes.length === 0) {
      return;
    }

    const width = targetWidth ?? this.bounds.width;
    const height = targetHeight ?? this.bounds.height;

    const scaleX = width / this.bounds.width;
    const scaleY = height / this.bounds.height;

    ctx.save();
    ctx.scale(scaleX, scaleY);
    if (this.bounds.minX !== 0 || this.bounds.minY !== 0) {
      ctx.translate(-this.bounds.minX, -this.bounds.minY);
    }

    for (const shape of this.shapes) {
      this.drawShape(ctx, shape);
    }

    ctx.restore();
  }

  private drawShape(ctx: CanvasRenderingContext2D, shape: VectorShape) {
    switch (shape.type) {
      case "rect":
        this.drawRect(ctx, shape);
        break;
      case "circle":
        this.drawCircle(ctx, shape);
        break;
      case "ellipse":
        this.drawEllipse(ctx, shape);
        break;
      case "line":
        this.drawLine(ctx, shape);
        break;
      case "polyline":
        this.drawPolyline(ctx, shape);
        break;
    }
  }

  private applyStroke(ctx: CanvasRenderingContext2D, shape: BaseShape) {
    if (!shape.stroke || shape.stroke === "none") {
      return;
    }
    const opacity = shape.strokeOpacity ?? shape.opacity ?? 1;
    if (opacity <= 0) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = shape.stroke;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = shape.strokeWidth ?? 1;
    if (shape.strokeLineCap) {
      ctx.lineCap = shape.strokeLineCap;
    }
    if (shape.strokeLineJoin) {
      ctx.lineJoin = shape.strokeLineJoin;
    }
    ctx.stroke();
    ctx.restore();
  }

  private applyFill(ctx: CanvasRenderingContext2D, shape: BaseShape) {
    if (!shape.fill || shape.fill === "none") {
      return;
    }
    const opacity = shape.fillOpacity ?? shape.opacity ?? 1;
    if (opacity <= 0) {
      return;
    }
    ctx.save();
    ctx.fillStyle = shape.fill;
    ctx.globalAlpha = opacity;
    ctx.fill();
    ctx.restore();
  }

  private drawRect(ctx: CanvasRenderingContext2D, shape: RectShape) {
    ctx.beginPath();
    ctx.rect(shape.x, shape.y, shape.width, shape.height);
    this.applyFill(ctx, shape);
    this.applyStroke(ctx, shape);
  }

  private drawCircle(ctx: CanvasRenderingContext2D, shape: CircleShape) {
    ctx.beginPath();
    ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
    this.applyFill(ctx, shape);
    this.applyStroke(ctx, shape);
  }

  private drawEllipse(ctx: CanvasRenderingContext2D, shape: EllipseShape) {
    ctx.beginPath();
    ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2);
    this.applyFill(ctx, shape);
    this.applyStroke(ctx, shape);
  }

  private drawLine(ctx: CanvasRenderingContext2D, shape: LineShape) {
    ctx.beginPath();
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    this.applyStroke(ctx, shape);
  }

  private drawPolyline(ctx: CanvasRenderingContext2D, shape: PolylineShape) {
    if (shape.points.length === 0) {
      return;
    }
    ctx.beginPath();
    const [first, ...rest] = shape.points;
    ctx.moveTo(first.x, first.y);
    for (const point of rest) {
      ctx.lineTo(point.x, point.y);
    }
    if (shape.closed) {
      ctx.closePath();
    }
    this.applyFill(ctx, shape);
    this.applyStroke(ctx, shape);
  }
}
