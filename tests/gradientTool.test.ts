import { describe, test } from '@jest/globals';

describe('GradientTool', () => {
  describe('handles', () => {
    test.todo('updates gradient direction when start handle is moved');
    test.todo('updates gradient length when end handle is dragged');
  });

  describe('sampling', () => {
    test.todo('samples the underlying canvas colors to compute gradient stops');
    test.todo('locks sampling preview when modifier key is held');
  });

  describe('parameter changes', () => {
    test.todo('applies color stop adjustments to the rendered gradient');
    test.todo('toggles between linear and radial modes without losing settings');
  });
});
