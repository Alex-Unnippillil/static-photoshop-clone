export interface NormalizedPointerEvent {
  /**
   * The original pointer event. Consumers should inspect this for modifier
   * keys, button state, etc.
   */
  readonly originalEvent: PointerEvent;
  /** Logical canvas X coordinate expressed in CSS pixels. */
  readonly x: number;
  /** Logical canvas Y coordinate expressed in CSS pixels. */
  readonly y: number;
  /** Device pixel X coordinate clamped to the canvas width. */
  readonly deviceX: number;
  /** Device pixel Y coordinate clamped to the canvas height. */
  readonly deviceY: number;
}

interface WorkerLike {
  postMessage(message: unknown): void;
}

export interface CanvasDprHandle {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly dpr: number;
  resize(): void;
  normalizeEvent(event: PointerEvent): NormalizedPointerEvent;
  destroy(): void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Service that centralizes device-pixel-ratio management for one or more
 * canvases. It keeps contexts scaled appropriately, exposes helpers for
 * pointer-event normalization, and can broadcast DPR changes to workers.
 */
export class DevicePixelRatioService {
  private readonly win: Window;
  private readonly canvases = new Set<CanvasRegistration>();
  private readonly workers = new Set<WorkerLike>();
  private readonly resizeListener: () => void;
  private dpr: number;

  constructor(win: Window = window) {
    this.win = win;
    this.dpr = this.readDevicePixelRatio();
    this.resizeListener = () => this.handleResize();
    this.win.addEventListener("resize", this.resizeListener);
  }

  /** The active device pixel ratio used by the service. */
  get devicePixelRatio(): number {
    return this.dpr;
  }

  /** Register a worker-like object to receive DPR updates. */
  registerWorker(worker: WorkerLike): () => void {
    this.workers.add(worker);
    this.sendDpr(worker);
    return () => {
      this.workers.delete(worker);
    };
  }

  /** Register a canvas/context pair with the service. */
  registerCanvas(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ): CanvasDprHandle {
    const registration = new CanvasRegistration(this, canvas, context);
    this.canvases.add(registration);
    registration.resize();
    return registration;
  }

  /** Stop managing canvases and remove window listeners. */
  destroy(): void {
    this.win.removeEventListener("resize", this.resizeListener);
    this.canvases.forEach((registration) => registration.disposeInternal());
    this.canvases.clear();
    this.workers.clear();
  }

  private unregister(registration: CanvasRegistration): void {
    this.canvases.delete(registration);
  }

  private readDevicePixelRatio(): number {
    return Number(this.win.devicePixelRatio) || 1;
  }

  private handleResize(): void {
    const next = this.readDevicePixelRatio();
    const changed = next !== this.dpr;
    if (changed) {
      this.dpr = next;
    }
    this.canvases.forEach((registration) => registration.resize());
    if (changed) {
      this.broadcastDpr();
    }
  }

  private applyToCanvas(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
  ): void {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * this.dpr));
    const height = Math.max(1, Math.round(rect.height * this.dpr));
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
    context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private normalizePointer(
    canvas: HTMLCanvasElement,
    event: PointerEvent,
  ): NormalizedPointerEvent {
    const rect = canvas.getBoundingClientRect();
    const relativeX = (event.clientX ?? NaN) - rect.left;
    const relativeY = (event.clientY ?? NaN) - rect.top;
    const hasClient = Number.isFinite(relativeX) && Number.isFinite(relativeY);

    const logicalX = clamp(
      hasClient
        ? relativeX
        : typeof event.offsetX === "number"
          ? event.offsetX
          : 0,
      0,
      rect.width,
    );
    const logicalY = clamp(
      hasClient
        ? relativeY
        : typeof event.offsetY === "number"
          ? event.offsetY
          : 0,
      0,
      rect.height,
    );

    const deviceX = clamp(
      Math.round(logicalX * this.dpr),
      0,
      Math.max(0, canvas.width - 1),
    );
    const deviceY = clamp(
      Math.round(logicalY * this.dpr),
      0,
      Math.max(0, canvas.height - 1),
    );

    return {
      originalEvent: event,
      x: logicalX,
      y: logicalY,
      deviceX,
      deviceY,
    };
  }

  private broadcastDpr(): void {
    this.workers.forEach((worker) => this.sendDpr(worker));
  }

  private sendDpr(worker: WorkerLike): void {
    worker.postMessage({ type: "dpr:update", value: this.dpr });
  }

  normalizeFor(
    registration: CanvasRegistration,
    event: PointerEvent,
  ): NormalizedPointerEvent {
    if (!registration.isDisposed()) {
      this.applyToCanvas(registration.canvas, registration.context);
    }
    return this.normalizePointer(registration.canvas, event);
  }

  resizeFor(registration: CanvasRegistration): void {
    if (registration.isDisposed()) return;
    this.applyToCanvas(registration.canvas, registration.context);
  }

  destroyRegistration(registration: CanvasRegistration): void {
    registration.disposeInternal();
    this.unregister(registration);
  }
}

class CanvasRegistration implements CanvasDprHandle {
  private disposed = false;

  constructor(
    private readonly service: DevicePixelRatioService,
    public readonly canvas: HTMLCanvasElement,
    public readonly context: CanvasRenderingContext2D,
  ) {}

  get dpr(): number {
    return this.service.devicePixelRatio;
  }

  resize(): void {
    if (this.disposed) return;
    this.service.resizeFor(this);
  }

  normalizeEvent(event: PointerEvent): NormalizedPointerEvent {
    return this.service.normalizeFor(this, event);
  }

  destroy(): void {
    if (this.disposed) return;
    this.service.destroyRegistration(this);
  }

  disposeInternal(): void {
    this.disposed = true;
  }

  isDisposed(): boolean {
    return this.disposed;
  }
}

