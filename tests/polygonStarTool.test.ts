import { describe, test } from '@jest/globals';

describe('PolygonStarTool', () => {
  describe('handles', () => {
    test.todo('updates radius handles to control polygon size dynamically');
    test.todo('adjusts inner radius handle to morph between polygon and star');
  });

  describe('sampling', () => {
    test.todo('respects snap-to-angle sampling when modifier key is held');
    test.todo('collects center point from cursor sample before drawing shape');
  });

  describe('parameter changes', () => {
    test.todo('re-renders preview when number of sides parameter changes');
    test.todo('preserves star inset ratio after toggling smoothing option');
  });
});
