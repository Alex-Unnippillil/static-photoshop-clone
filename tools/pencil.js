import { saveState } from '../undoRedo.js';

export default class PencilTool {
  constructor(erase = false) {
    this.erase = erase;
    this.drawing = false;
  }

  onPointerDown(state, e) {
    this.drawing = true;
    state.ctx.beginPath();
    state.ctx.moveTo(e.offsetX, e.offsetY);
    saveState(state);
  }

  onPointerMove(state, e) {
    if (!this.drawing) return;
    const ctx = state.ctx;
    ctx.lineWidth = document.getElementById('lineWidth').value;
    ctx.strokeStyle = this.erase ? '#ffffff' : document.getElementById('colorPicker').value;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }

  onPointerUp(state, e) {
    this.drawing = false;
  }
}
