import { saveState } from '../undoRedo.js';

export default class RectangleTool {
  constructor() {
    this.drawing = false;
    this.startX = 0;
    this.startY = 0;
  }

  onPointerDown(state, e) {
    this.drawing = true;
    this.startX = e.offsetX;
    this.startY = e.offsetY;
    saveState(state);
  }

  onPointerMove(state, e) {
    // No preview implementation
  }

  onPointerUp(state, e) {
    if (!this.drawing) return;
    this.drawing = false;
    const x = e.offsetX;
    const y = e.offsetY;
    const ctx = state.ctx;
    ctx.lineWidth = document.getElementById('lineWidth').value;
    ctx.strokeStyle = document.getElementById('colorPicker').value;
    ctx.strokeRect(this.startX, this.startY, x - this.startX, y - this.startY);
  }
}
