import {
  type SelectionBounds,
  type SelectionState,
} from "../core/Editor.js";
import { Editor } from "../core/Editor.js";
import type { Tool } from "./Tool.js";

type HandlePosition =
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

interface ActiveInteraction {
  id: number;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  initialBounds: SelectionBounds;
  handle?: HandlePosition;
}

export class TransformTool implements Tool {
  cursor = "move";

  private overlay: HTMLDivElement | null = null;
  private handles: Map<HandlePosition, HTMLDivElement> = new Map();
  private editor: Editor | null = null;
  private interaction: ActiveInteraction | null = null;
  private baseImage: ImageData | null = null;
  private snapshotCanvas: HTMLCanvasElement | null = null;
  private selectionSubscription: (() => void) | null = null;
  private overlayListeners: Array<() => void> = [];
  private latestBounds: SelectionBounds | null = null;

  onActivate(editor: Editor): void {
    this.editor = editor;
    this.ensureSelection(editor);
    this.ensureOverlay(editor);
    this.subscribeToSelection(editor);
    this.updateOverlay(editor.getSelection());
  }

  onPointerDown(e: PointerEvent, editor: Editor): void {
    const selection = this.ensureSelection(editor);
    if (!selection || e.button !== 0) return;
    const { offsetX, offsetY } = e;
    if (this.pointInBounds(offsetX, offsetY, selection.bounds)) {
      this.beginMoveInteraction(e.pointerId, offsetX, offsetY, editor, false);
    }
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.editor || !this.interaction) return;
    if (this.interaction.id !== e.pointerId) return;
    this.updateInteraction(e.offsetX, e.offsetY, this.editor);
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.editor || !this.interaction) return;
    if (this.interaction.id !== e.pointerId) return;
    this.finishInteraction(this.editor);
  }

  destroy(): void {
    this.detachOverlay();
    this.selectionSubscription?.();
    this.selectionSubscription = null;
    this.editor = null;
    this.interaction = null;
    this.baseImage = null;
    this.snapshotCanvas = null;
    this.latestBounds = null;
  }

  private ensureSelection(editor: Editor): SelectionState | null {
    const selection = editor.getSelection();
    if (selection) {
      return selection;
    }
    const rect = editor.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    const contentBounds = this.getContentBounds(editor);
    const nextSelection: SelectionState = {
      layer: editor.canvas,
      bounds:
        contentBounds ?? {
          x: 0,
          y: 0,
          width: rect.width,
          height: rect.height,
        },
    };
    editor.setSelection(nextSelection);
    return nextSelection;
  }

  private getContentBounds(editor: Editor): SelectionBounds | null {
    const rect = editor.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return null;
    }
    const { width, height } = editor.canvas;
    if (!width || !height) {
      return null;
    }
    const image = editor.ctx.getImageData(0, 0, width, height);
    const data = image.data;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha !== 0) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) {
      return null;
    }
    const dpr = width / rect.width || 1;
    return {
      x: minX / dpr,
      y: minY / dpr,
      width: Math.max(1, (maxX - minX + 1) / dpr),
      height: Math.max(1, (maxY - minY + 1) / dpr),
    };
  }

  private subscribeToSelection(editor: Editor) {
    this.selectionSubscription?.();
    this.selectionSubscription = editor.onSelectionChange((selection) => {
      this.updateOverlay(selection);
    });
  }

  private ensureOverlay(editor: Editor) {
    if (this.overlay) return;
    const container = editor.canvas.parentElement;
    if (!container) return;
    const overlay = document.createElement("div");
    overlay.className = "selection-overlay";
    container.appendChild(overlay);
    this.overlay = overlay;
    this.overlayListeners.push(
      this.listen(overlay, "pointerdown", (e) => {
        if (!this.isPointerLike(e) || e.button !== 0) return;
        if (!this.editor) return;
        const rect = this.editor.canvas.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        const selection = this.ensureSelection(this.editor);
        if (!selection) return;
        if ((e.target as HTMLElement).dataset.handle) {
          return;
        }
        this.beginMoveInteraction(e.pointerId, startX, startY, this.editor, true);
        this.trySetPointerCapture(overlay, e.pointerId);
      }),
    );

    const handlePositions: HandlePosition[] = [
      "nw",
      "n",
      "ne",
      "e",
      "se",
      "s",
      "sw",
      "w",
    ];

    handlePositions.forEach((pos) => {
      const handle = document.createElement("div");
      handle.className = "selection-handle";
      handle.dataset.handle = pos;
      overlay.appendChild(handle);
      this.overlayListeners.push(
        this.listen(handle, "pointerdown", (event) => {
          if (!this.isPointerLike(event) || event.button !== 0) return;
          if (!this.editor) return;
          event.stopPropagation();
          const rect = this.editor.canvas.getBoundingClientRect();
          const startX = event.clientX - rect.left;
          const startY = event.clientY - rect.top;
          this.beginResizeInteraction(
            event.pointerId,
            startX,
            startY,
            this.editor,
            pos,
          );
          this.trySetPointerCapture(handle, event.pointerId);
        }),
      );
      this.overlayListeners.push(
        this.listen(handle, "pointerup", (event) => {
          if (this.isPointerLike(event)) {
            this.tryReleasePointerCapture(handle, event.pointerId);
          }
        }),
      );
      this.overlayListeners.push(
        this.listen(handle, "pointercancel", (event) => {
          if (this.isPointerLike(event)) {
            this.tryReleasePointerCapture(handle, event.pointerId);
          }
        }),
      );
      this.overlayListeners.push(
        this.listen(handle, "pointermove", (event) => {
          if (!this.isPointerLike(event)) return;
          if (!this.editor || !this.interaction) return;
          if (this.interaction.id !== event.pointerId) return;
          const rect = this.editor.canvas.getBoundingClientRect();
          const currentX = event.clientX - rect.left;
          const currentY = event.clientY - rect.top;
          this.updateInteraction(currentX, currentY, this.editor);
        }),
      );
      this.overlayListeners.push(
        this.listen(handle, "lostpointercapture", () => {
          if (this.editor && this.interaction) {
            this.finishInteraction(this.editor);
          }
        }),
      );
      this.handles.set(pos, handle);
    });

    this.overlayListeners.push(
      this.listen(overlay, "pointermove", (event) => {
        if (!this.isPointerLike(event)) return;
        if (!this.editor || !this.interaction) return;
        if (this.interaction.id !== event.pointerId) return;
        const rect = this.editor.canvas.getBoundingClientRect();
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;
        this.updateInteraction(currentX, currentY, this.editor);
      }),
    );
    this.overlayListeners.push(
      this.listen(overlay, "pointerup", (event) => {
        if (this.isPointerLike(event)) {
          this.tryReleasePointerCapture(overlay, event.pointerId);
        }
        if (this.editor) {
          this.finishInteraction(this.editor);
        }
      }),
    );
    this.overlayListeners.push(
      this.listen(overlay, "pointercancel", (event) => {
        if (this.isPointerLike(event)) {
          this.tryReleasePointerCapture(overlay, event.pointerId);
        }
        if (this.editor) {
          this.finishInteraction(this.editor);
        }
      }),
    );
  }

  private beginMoveInteraction(
    pointerId: number,
    startX: number,
    startY: number,
    editor: Editor,
    initiatedOutsideCanvas: boolean,
  ) {
    const selection = this.ensureSelection(editor);
    if (!selection) return;
    if (this.interaction) return;
    this.prepareSnapshot(editor, selection.bounds);
    if (initiatedOutsideCanvas) {
      editor.saveState();
    }
    this.interaction = {
      id: pointerId,
      mode: "move",
      startX,
      startY,
      initialBounds: { ...selection.bounds },
    };
  }

  private beginResizeInteraction(
    pointerId: number,
    startX: number,
    startY: number,
    editor: Editor,
    handle: HandlePosition,
  ) {
    const selection = this.ensureSelection(editor);
    if (!selection) return;
    if (this.interaction) return;
    this.prepareSnapshot(editor, selection.bounds);
    editor.saveState();
    this.interaction = {
      id: pointerId,
      mode: "resize",
      startX,
      startY,
      handle,
      initialBounds: { ...selection.bounds },
    };
  }

  private prepareSnapshot(editor: Editor, bounds: SelectionBounds) {
    const rect = editor.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height || bounds.width === 0 || bounds.height === 0) {
      return;
    }
    const dpr = editor.canvas.width / rect.width;
    const pixelX = Math.round(bounds.x * dpr);
    const pixelY = Math.round(bounds.y * dpr);
    const pixelWidth = Math.max(1, Math.round(bounds.width * dpr));
    const pixelHeight = Math.max(1, Math.round(bounds.height * dpr));
    this.baseImage = editor.ctx.getImageData(
      0,
      0,
      editor.canvas.width,
      editor.canvas.height,
    );
    const selectionImage = editor.ctx.getImageData(
      pixelX,
      pixelY,
      pixelWidth,
      pixelHeight,
    );
    const snapshotCanvas = document.createElement("canvas");
    snapshotCanvas.width = pixelWidth;
    snapshotCanvas.height = pixelHeight;
    const snapshotCtx = snapshotCanvas.getContext("2d");
    if (!snapshotCtx) return;
    snapshotCtx.putImageData(selectionImage, 0, 0);
    this.snapshotCanvas = snapshotCanvas;
    editor.ctx.putImageData(this.baseImage, 0, 0);
    editor.ctx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.baseImage = editor.ctx.getImageData(
      0,
      0,
      editor.canvas.width,
      editor.canvas.height,
    );
    this.latestBounds = { ...bounds };
    this.renderPreview(bounds, editor);
  }

  private updateInteraction(x: number, y: number, editor: Editor) {
    if (!this.interaction || !this.snapshotCanvas || !this.baseImage) return;
    const bounds = this.computeBounds(x, y, editor);
    if (!bounds) return;
    editor.updateSelectionBounds(bounds);
    this.renderPreview(bounds, editor);
    this.updateOverlayForBounds(bounds);
    this.latestBounds = bounds;
  }

  private finishInteraction(editor: Editor) {
    if (!this.interaction) return;
    const selection = editor.getSelection();
    if (!selection || !this.snapshotCanvas || !this.baseImage) {
      this.resetInteraction();
      return;
    }
    const finalBounds = this.latestBounds ?? selection.bounds;
    editor.updateSelectionBounds(finalBounds);
    this.renderPreview(finalBounds, editor);
    this.resetInteraction();
  }

  private computeBounds(x: number, y: number, editor: Editor): SelectionBounds | null {
    if (!this.interaction || !editor.getSelection()) return null;
    const { initialBounds, mode, startX, startY, handle } = this.interaction;
    const rect = editor.canvas.getBoundingClientRect();
    const maxWidth = rect.width;
    const maxHeight = rect.height;
    let next: SelectionBounds = { ...initialBounds };
    if (mode === "move") {
      const dx = x - startX;
      const dy = y - startY;
      next = {
        ...next,
        x: this.clamp(
          initialBounds.x + dx,
          0,
          Math.max(0, maxWidth - initialBounds.width),
        ),
        y: this.clamp(
          initialBounds.y + dy,
          0,
          Math.max(0, maxHeight - initialBounds.height),
        ),
      };
    } else if (mode === "resize" && handle) {
      const dx = x - startX;
      const dy = y - startY;
      switch (handle) {
        case "n": {
          const newY = Math.min(
            initialBounds.y + dy,
            initialBounds.y + initialBounds.height - 1,
          );
          const clampedY = Math.max(0, newY);
          next.y = clampedY;
          next.height = Math.max(1, initialBounds.height + (initialBounds.y - clampedY));
          break;
        }
        case "s":
          next.height = Math.max(1, initialBounds.height + dy);
          break;
        case "e":
          next.width = Math.max(1, initialBounds.width + dx);
          break;
        case "w": {
          const newX = Math.min(
            initialBounds.x + dx,
            initialBounds.x + initialBounds.width - 1,
          );
          const clampedX = Math.max(0, newX);
          next.x = clampedX;
          next.width = Math.max(1, initialBounds.width + (initialBounds.x - clampedX));
          break;
        }
        case "ne": {
          const newY = Math.min(
            initialBounds.y + dy,
            initialBounds.y + initialBounds.height - 1,
          );
          const clampedY = Math.max(0, newY);
          next.width = Math.max(1, initialBounds.width + dx);
          next.y = clampedY;
          next.height = Math.max(1, initialBounds.height + (initialBounds.y - clampedY));
          break;
        }
        case "nw": {
          const newX = Math.min(
            initialBounds.x + dx,
            initialBounds.x + initialBounds.width - 1,
          );
          const clampedX = Math.max(0, newX);
          const newY = Math.min(
            initialBounds.y + dy,
            initialBounds.y + initialBounds.height - 1,
          );
          const clampedY = Math.max(0, newY);
          next.x = clampedX;
          next.width = Math.max(1, initialBounds.width + (initialBounds.x - clampedX));
          next.y = clampedY;
          next.height = Math.max(1, initialBounds.height + (initialBounds.y - clampedY));
          break;
        }
        case "se":
          next.width = Math.max(1, initialBounds.width + dx);
          next.height = Math.max(1, initialBounds.height + dy);
          break;
        case "sw": {
          const newX = Math.min(
            initialBounds.x + dx,
            initialBounds.x + initialBounds.width - 1,
          );
          const clampedX = Math.max(0, newX);
          next.x = clampedX;
          next.width = Math.max(1, initialBounds.width + (initialBounds.x - clampedX));
          next.height = Math.max(1, initialBounds.height + dy);
          break;
        }
      }
      next.width = Math.max(1, Math.min(next.width, maxWidth - next.x));
      next.height = Math.max(1, Math.min(next.height, maxHeight - next.y));
    }
    return next;
  }

  private renderPreview(bounds: SelectionBounds, editor: Editor) {
    if (!this.snapshotCanvas || !this.baseImage) return;
    editor.ctx.putImageData(this.baseImage, 0, 0);
    editor.ctx.drawImage(
      this.snapshotCanvas,
      0,
      0,
      this.snapshotCanvas.width,
      this.snapshotCanvas.height,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
    );
  }

  private updateOverlay(selection: SelectionState | null) {
    if (!this.overlay) return;
    if (!selection) {
      this.overlay.style.display = "none";
      return;
    }
    this.overlay.style.display = "block";
    this.updateOverlayForBounds(selection.bounds);
  }

  private updateOverlayForBounds(bounds: SelectionBounds) {
    if (!this.overlay) return;
    this.overlay.style.left = `${bounds.x}px`;
    this.overlay.style.top = `${bounds.y}px`;
    this.overlay.style.width = `${bounds.width}px`;
    this.overlay.style.height = `${bounds.height}px`;
    this.positionHandles(bounds);
  }

  private positionHandles(bounds: SelectionBounds) {
    const positions: Record<HandlePosition, [number, number]> = {
      n: [bounds.width / 2, 0],
      ne: [bounds.width, 0],
      e: [bounds.width, bounds.height / 2],
      se: [bounds.width, bounds.height],
      s: [bounds.width / 2, bounds.height],
      sw: [0, bounds.height],
      w: [0, bounds.height / 2],
      nw: [0, 0],
    };

    this.handles.forEach((handle, key) => {
      const [x, y] = positions[key];
      handle.style.left = `${x}px`;
      handle.style.top = `${y}px`;
    });
  }

  private resetInteraction() {
    this.interaction = null;
    this.baseImage = null;
    this.snapshotCanvas = null;
    this.latestBounds = null;
  }

  private detachOverlay() {
    this.overlayListeners.forEach((dispose) => dispose());
    this.overlayListeners = [];
    if (this.overlay?.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
    }
    this.overlay = null;
    this.handles.clear();
    this.latestBounds = null;
  }

  private pointInBounds(x: number, y: number, bounds: SelectionBounds) {
    return (
      x >= bounds.x &&
      y >= bounds.y &&
      x <= bounds.x + bounds.width &&
      y <= bounds.y + bounds.height
    );
  }

  private clamp(value: number, min: number, max: number) {
    if (max < min) return min;
    return Math.min(Math.max(value, min), max);
  }

  private isPointerLike(event: Event): event is PointerEvent {
    return typeof (event as PointerEvent).pointerId === "number";
  }

  private trySetPointerCapture(target: Element, pointerId: number) {
    (target as unknown as { setPointerCapture?: (id: number) => void }).setPointerCapture?.(
      pointerId,
    );
  }

  private tryReleasePointerCapture(target: Element, pointerId: number) {
    (target as unknown as { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(
      pointerId,
    );
  }

  private listen<T extends Event>(
    target: EventTarget,
    type: string,
    handler: (event: T) => void,
  ) {
    target.addEventListener(type, handler as EventListener);
    return () => target.removeEventListener(type, handler as EventListener);
  }
}
