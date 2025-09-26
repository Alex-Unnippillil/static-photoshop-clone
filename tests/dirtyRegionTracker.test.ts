import {
  DirtyRegionTracker,
  type Rect,
} from "../src/core/DirtyRegionTracker.js";

describe("DirtyRegionTracker", () => {
  it("merges overlapping regions into a single rect", () => {
    const tracker = new DirtyRegionTracker();
    const regions: Rect[] = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 5, y: 5, width: 8, height: 8 },
      { x: 30, y: 30, width: 5, height: 5 },
    ];

    tracker.setRegions(regions);

    expect(tracker.getRegions()).toEqual([
      { x: 0, y: 0, width: 13, height: 13 },
      { x: 30, y: 30, width: 5, height: 5 },
    ]);
  });

  it("clears all regions when requested", () => {
    const tracker = new DirtyRegionTracker();
    tracker.setRegions([{ x: 1, y: 1, width: 2, height: 2 }]);
    tracker.clear();
    expect(tracker.getRegions()).toEqual([]);
  });
});
