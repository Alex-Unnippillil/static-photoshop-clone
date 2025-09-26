import { floodFill, type FloodFillResult } from "../core/floodFill.js";

type FloodFillRequestMessage = {
  id: number;
  type: "fill";
  width: number;
  height: number;
  startX: number;
  startY: number;
  fill: [number, number, number, number];
  maxPixels: number;
  imageBuffer?: ArrayBuffer;
  canvas?: OffscreenCanvas;
};

type FloodFillResponseMessage = {
  id: number;
  type: "result";
  dirtyRects: FloodFillResult["dirtyRects"];
  aborted: boolean;
};

type FloodFillErrorMessage = {
  id: number;
  type: "error";
  message: string;
};

type WorkerIncomingMessage = FloodFillRequestMessage;
type WorkerOutgoingMessage =
  | FloodFillResponseMessage
  | FloodFillErrorMessage;

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener("message", (event: MessageEvent<WorkerIncomingMessage>) => {
  const msg = event.data;
  if (!msg || msg.type !== "fill") {
    return;
  }

  try {
    const { width, height, startX, startY, fill, maxPixels } = msg;

    let buffer = msg.imageBuffer;
    if (!buffer && msg.canvas) {
      const ctx = msg.canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Offscreen canvas missing 2D context");
      }
      const imageData = ctx.getImageData(0, 0, width, height);
      buffer = imageData.data.buffer.slice(0);
    }

    if (!buffer) {
      throw new Error("Flood fill request missing pixel buffer");
    }

    const pixels = new Uint8ClampedArray(buffer);
    const result = floodFill(pixels, {
      width,
      height,
      startX,
      startY,
      fill,
      maxPixels,
    });

    const transfers = result.dirtyRects.map((rect) => rect.buffer);
    const response: WorkerOutgoingMessage = {
      id: msg.id,
      type: "result",
      dirtyRects: result.dirtyRects,
      aborted: result.aborted,
    };
    self.postMessage(response, transfers);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown flood fill error";
    const response: WorkerOutgoingMessage = {
      id: msg.id,
      type: "error",
      message,
    };
    self.postMessage(response);
  }
});
