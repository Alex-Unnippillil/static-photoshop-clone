import { describe, test } from '@jest/globals';

describe('CloneStampTool', () => {
  describe('handles', () => {
    test.todo('tracks offset handle between source and destination cursors');
    test.todo('allows rotation handle to adjust sampled texture orientation');
  });

  describe('sampling', () => {
    test.todo('samples from the source point when modifier key is pressed');
    test.todo('displays sampled preview aligned with brush size');
  });

  describe('parameter changes', () => {
    test.todo('updates brush hardness parameter in real time while painting');
    test.todo('respects flow parameter adjustments across continuous strokes');
  });
});
