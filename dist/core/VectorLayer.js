export class VectorLayer {
    constructor(shapes, bounds) {
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
    isEmpty() {
        return this.shapes.length === 0;
    }
    render(ctx, targetWidth, targetHeight) {
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
    drawShape(ctx, shape) {
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
    applyStroke(ctx, shape) {
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
    applyFill(ctx, shape) {
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
    drawRect(ctx, shape) {
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        this.applyFill(ctx, shape);
        this.applyStroke(ctx, shape);
    }
    drawCircle(ctx, shape) {
        ctx.beginPath();
        ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
        this.applyFill(ctx, shape);
        this.applyStroke(ctx, shape);
    }
    drawEllipse(ctx, shape) {
        ctx.beginPath();
        ctx.ellipse(shape.cx, shape.cy, shape.rx, shape.ry, 0, 0, Math.PI * 2);
        this.applyFill(ctx, shape);
        this.applyStroke(ctx, shape);
    }
    drawLine(ctx, shape) {
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        this.applyStroke(ctx, shape);
    }
    drawPolyline(ctx, shape) {
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
