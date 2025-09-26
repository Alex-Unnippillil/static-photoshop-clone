import { Buffer } from "buffer";

const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{6})$/;

type PathCommand =
  | { type: "moveTo"; x: number; y: number }
  | { type: "lineTo"; x: number; y: number }
  | {
      type: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      rotation: number;
      startAngle: number;
      endAngle: number;
    };

function parseColor(color: string): [number, number, number] {
  const match = color.match(HEX_COLOR_REGEX);
  if (!match) {
    throw new Error(`Unsupported color format: ${color}`);
  }
  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return [r, g, b];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(value);
}

export class HeadlessCanvasRenderingContext2D {
  lineWidth = 1;
  strokeStyle = "#000000";
  fillStyle = "#000000";

  private path: PathCommand[] = [];
  private readonly data: Uint8ClampedArray;
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  beginPath(): void {
    this.path = [];
  }

  moveTo(x: number, y: number): void {
    this.path.push({ type: "moveTo", x, y });
  }

  lineTo(x: number, y: number): void {
    this.path.push({ type: "lineTo", x, y });
  }

  ellipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
  ): void {
    this.path.push({
      type: "ellipse",
      cx,
      cy,
      rx,
      ry,
      rotation,
      startAngle,
      endAngle,
    });
  }

  closePath(): void {
    // No-op for this simplified context.
  }

  stroke(): void {
    let previous: { x: number; y: number } | null = null;
    for (const command of this.path) {
      if (command.type === "moveTo") {
        previous = { x: command.x, y: command.y };
      } else if (command.type === "lineTo" && previous) {
        this.drawLine(previous.x, previous.y, command.x, command.y);
        previous = { x: command.x, y: command.y };
      } else if (command.type === "ellipse") {
        this.drawEllipseStroke(command);
        previous = null;
      }
    }
  }

  fill(): void {
    for (const command of this.path) {
      if (command.type === "ellipse") {
        this.fillEllipse(command);
      }
    }
  }

  strokeRect(x: number, y: number, width: number, height: number): void {
    const x1 = x;
    const y1 = y;
    const x2 = x + width;
    const y2 = y + height;
    this.drawLine(x1, y1, x2, y1);
    this.drawLine(x2, y1, x2, y2);
    this.drawLine(x2, y2, x1, y2);
    this.drawLine(x1, y2, x1, y1);
  }

  fillRect(x: number, y: number, width: number, height: number): void {
    const xStart = Math.round(Math.min(x, x + width));
    const xEnd = Math.round(Math.max(x, x + width));
    const yStart = Math.round(Math.min(y, y + height));
    const yEnd = Math.round(Math.max(y, y + height));
    const [r, g, b] = parseColor(this.fillStyle);
    for (let yy = yStart; yy < yEnd; yy++) {
      for (let xx = xStart; xx < xEnd; xx++) {
        this.paintPixel(xx, yy, r, g, b, 255);
      }
    }
  }

  clearRect(x: number, y: number, width: number, height: number): void {
    const xStart = Math.max(0, Math.floor(Math.min(x, x + width)));
    const xEnd = Math.min(this.width, Math.ceil(Math.max(x, x + width)));
    const yStart = Math.max(0, Math.floor(Math.min(y, y + height)));
    const yEnd = Math.min(this.height, Math.ceil(Math.max(y, y + height)));
    for (let yy = yStart; yy < yEnd; yy++) {
      for (let xx = xStart; xx < xEnd; xx++) {
        const index = (yy * this.width + xx) * 4;
        this.data[index] = 0;
        this.data[index + 1] = 0;
        this.data[index + 2] = 0;
        this.data[index + 3] = 0;
      }
    }
  }

  getImageData(
    _sx: number,
    _sy: number,
    _sw: number,
    _sh: number,
  ): ImageData {
    return {
      data: new Uint8ClampedArray(this.data),
      width: this.width,
      height: this.height,
    } as unknown as ImageData;
  }

  putImageData(imageData: ImageData, dx: number, dy: number): void {
    if (dx !== 0 || dy !== 0) {
      throw new Error("Headless context only supports zero offset putImageData");
    }
    this.data.set(imageData.data);
  }

  exportData(): string {
    return Buffer.from(this.data).toString("base64");
  }

  setTransform(): void {
    // No-op: the mock context renders directly in device pixels.
  }

  scale(): void {
    // No-op for the mock context.
  }

  private drawLine(x0: number, y0: number, x1: number, y1: number) {
    const [r, g, b] = parseColor(this.strokeStyle);
    let xi = round(x0);
    let yi = round(y0);
    const xEnd = round(x1);
    const yEnd = round(y1);

    const dx = Math.abs(xEnd - xi);
    const sx = xi < xEnd ? 1 : -1;
    const dy = -Math.abs(yEnd - yi);
    const sy = yi < yEnd ? 1 : -1;
    let err = dx + dy;

    while (true) {
      this.paintStrokePixel(xi, yi, r, g, b);
      if (xi === xEnd && yi === yEnd) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        xi += sx;
      }
      if (e2 <= dx) {
        err += dx;
        yi += sy;
      }
    }
  }

  private drawEllipseStroke(command: Extract<PathCommand, { type: "ellipse" }>) {
    const steps = Math.max(24, Math.ceil(Math.max(command.rx, command.ry) * 6));
    const cos = Math.cos(command.rotation);
    const sin = Math.sin(command.rotation);
    let prevX: number | null = null;
    let prevY: number | null = null;
    for (let i = 0; i <= steps; i++) {
      const t =
        command.startAngle + ((command.endAngle - command.startAngle) * i) / steps;
      const localX = command.rx * Math.cos(t);
      const localY = command.ry * Math.sin(t);
      const x = command.cx + localX * cos - localY * sin;
      const y = command.cy + localX * sin + localY * cos;
      if (prevX !== null && prevY !== null) {
        this.drawLine(prevX, prevY, x, y);
      }
      prevX = x;
      prevY = y;
    }
  }

  private fillEllipse(command: Extract<PathCommand, { type: "ellipse" }>) {
    const [r, g, b] = parseColor(this.fillStyle);
    const cos = Math.cos(command.rotation);
    const sin = Math.sin(command.rotation);
    const minX = Math.floor(command.cx - command.rx) - 1;
    const maxX = Math.ceil(command.cx + command.rx) + 1;
    const minY = Math.floor(command.cy - command.ry) - 1;
    const maxY = Math.ceil(command.cy + command.ry) + 1;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const localX = x - command.cx;
        const localY = y - command.cy;
        const rotatedX = localX * cos + localY * sin;
        const rotatedY = -localX * sin + localY * cos;
        const normalized =
          (rotatedX * rotatedX) / Math.max(command.rx * command.rx, 1) +
          (rotatedY * rotatedY) / Math.max(command.ry * command.ry, 1);
        if (normalized <= 1) {
          this.paintPixel(x, y, r, g, b, 255);
        }
      }
    }
  }

  private paintStrokePixel(x: number, y: number, r: number, g: number, b: number) {
    const radius = Math.max(0, Math.floor(this.lineWidth / 2));
    if (radius === 0) {
      this.paintPixel(x, y, r, g, b, 255);
      return;
    }
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          this.paintPixel(x + dx, y + dy, r, g, b, 255);
        }
      }
    }
  }

  private paintPixel(x: number, y: number, r: number, g: number, b: number, a: number) {
    const clampedX = round(clamp(x, 0, this.width - 1));
    const clampedY = round(clamp(y, 0, this.height - 1));
    const index = (clampedY * this.width + clampedX) * 4;
    this.data[index] = r;
    this.data[index + 1] = g;
    this.data[index + 2] = b;
    this.data[index + 3] = a;
  }
}

type ListenerEntry = {
  original: EventListenerOrEventListenerObject;
  handler: EventListener;
};

export class HeadlessCanvasElement {
  width: number;
  height: number;
  readonly ctx: HeadlessCanvasRenderingContext2D;
  private readonly listeners = new Map<string, Set<ListenerEntry>>();

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.ctx = new HeadlessCanvasRenderingContext2D(width, height);
  }

  getContext(contextId: "2d"): HeadlessCanvasRenderingContext2D | null {
    if (contextId === "2d") {
      return this.ctx;
    }
    return null;
  }

  getBoundingClientRect(): DOMRect {
    return {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      top: 0,
      left: 0,
      right: this.width,
      bottom: this.height,
      toJSON() {
        return {};
      },
    } as DOMRect;
  }

  toDataURL(): string {
    return `data:application/octet-stream;base64,${this.ctx.exportData()}`;
  }

  exportData() {
    return this.ctx.exportData();
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    _options?: boolean | AddEventListenerOptions,
  ) {
    const existing = this.listeners.get(type) ?? new Set<ListenerEntry>();
    const handler =
      typeof listener === "function" ? listener : listener.handleEvent.bind(listener);
    existing.add({ original: listener, handler });
    this.listeners.set(type, existing);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    _options?: boolean | EventListenerOptions,
  ) {
    const existing = this.listeners.get(type);
    if (!existing) return;
    for (const entry of Array.from(existing)) {
      if (entry.original === listener) {
        existing.delete(entry);
      }
    }
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type);
    if (!listeners) return true;
    for (const listener of listeners) {
      listener.handler.call(this, event);
    }
    return !event.defaultPrevented;
  }
}

export function createHeadlessCanvas(width: number, height: number) {
  const canvas = new HeadlessCanvasElement(width, height);
  const element = canvas as unknown as HTMLCanvasElement & {
    setPointerCapture?: (id: number) => void;
    releasePointerCapture?: (id: number) => void;
  };
  element.width = width;
  element.height = height;
  const getContext = canvas.getContext.bind(canvas);
  element.getContext = ((type: string) => {
    const ctx = getContext(type);
    return ctx ? (ctx as unknown as CanvasRenderingContext2D) : null;
  }) as typeof element.getContext;
  element.setPointerCapture = () => {};
  element.releasePointerCapture = () => {};
  element.toDataURL = () => canvas.toDataURL();
  Object.defineProperty(element, "style", {
    value: { cursor: "crosshair" } as CSSStyleDeclaration,
    writable: false,
  });
  element.addEventListener = canvas.addEventListener.bind(canvas);
  element.removeEventListener = canvas.removeEventListener.bind(canvas);
  element.dispatchEvent = canvas.dispatchEvent.bind(canvas);

  return {
    canvas: element,
    ctx: canvas.ctx,
  };
}
