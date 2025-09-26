export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bounds {
  width: number;
  height: number;
}

function rectanglesOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function mergeRectangles(rectangles: Rect[]): Rect[] {
  const merged: Rect[] = [];
  for (const rect of rectangles) {
    if (rect.width <= 0 || rect.height <= 0) continue;
    let current = { ...rect };
    for (let i = 0; i < merged.length; ) {
      const candidate = merged[i];
      if (rectanglesOverlap(candidate, current)) {
        current = {
          x: Math.min(candidate.x, current.x),
          y: Math.min(candidate.y, current.y),
          width:
            Math.max(candidate.x + candidate.width, current.x + current.width) -
            Math.min(candidate.x, current.x),
          height:
            Math.max(candidate.y + candidate.height, current.y + current.height) -
            Math.min(candidate.y, current.y),
        };
        merged.splice(i, 1);
      } else {
        i += 1;
      }
    }
    merged.push(current);
  }
  return merged;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clipRect(rect: Rect, bounds: Bounds): Rect | null {
  const maxX = rect.x + rect.width;
  const maxY = rect.y + rect.height;
  const clippedX = clamp(rect.x, 0, bounds.width);
  const clippedY = clamp(rect.y, 0, bounds.height);
  const clippedMaxX = clamp(maxX, 0, bounds.width);
  const clippedMaxY = clamp(maxY, 0, bounds.height);
  const width = clippedMaxX - clippedX;
  const height = clippedMaxY - clippedY;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return {
    x: Math.floor(clippedX),
    y: Math.floor(clippedY),
    width: Math.ceil(width),
    height: Math.ceil(height),
  };
}

export function expandRectForStroke(
  rect: Rect,
  lineWidth: number,
  bounds: Bounds,
): Rect | null {
  const padding = Math.ceil(lineWidth / 2);
  const expanded: Rect = {
    x: Math.floor(rect.x - padding),
    y: Math.floor(rect.y - padding),
    width: Math.ceil(rect.width + padding * 2),
    height: Math.ceil(rect.height + padding * 2),
  };
  return clipRect(expanded, bounds);
}

export class DirtyRegionTracker {
  private regions: Rect[] = [];

  clear(): void {
    this.regions = [];
  }

  setRegions(rectangles: Rect[]): void {
    this.regions = mergeRectangles(rectangles);
  }

  getRegions(): readonly Rect[] {
    return this.regions;
  }
}
